import { open } from "node:fs/promises";

(async () => {
  const TOTAL_WRITES = 10000000;
  let totalWrites = 0;
  let totalBytes = 0;
  let drainCount = 0;

  console.log("📝 Opening file for writing...");
  const fileHandle = await open("src.txt", "w");
  console.log("✅ File opened\n");

  const stream = fileHandle.createWriteStream();
  console.log(`📋 Buffer size: ${stream.writableHighWaterMark} bytes\n`);

  console.log("✍️  Writing data...\n");
  console.time("writeTime");

  let i = 0;

  const writeBuff = () => {
    while (i < TOTAL_WRITES) {
      const buff = Buffer.from(` ${i} `, "utf-8");

      totalWrites++;
      totalBytes += buff.length;
      i++;

      if (i >= TOTAL_WRITES) {
        return stream.end(buff);
      }

      if (!stream.write(buff)) {
        drainCount++;
        console.log(
          `⏸️  Paused at write #${totalWrites.toLocaleString()} (drain #${drainCount})`,
        );
        break;
      }
    }
  };

  stream.on("drain", () => {
    console.log(`▶️  Resumed writing (buffer drained)`);
    writeBuff();
  });

  stream.on("finish", async () => {
    console.timeEnd("writeTime");
    console.log("\n" + "═".repeat(50));
    console.log("📊 SUMMARY");
    console.log("═".repeat(50));
    console.log(`Total writes:     ${totalWrites.toLocaleString()}`);
    console.log(`Total bytes:      ${totalBytes.toLocaleString()} bytes`);
    console.log(
      `Average size:     ${(totalBytes / totalWrites).toFixed(2)} bytes/write`,
    );
    console.log(`Drain events:     ${drainCount}`);
    console.log(
      `Writes per drain: ${Math.floor(totalWrites / drainCount).toLocaleString()}`,
    );
    console.log("═".repeat(50));
    console.log("✅ Writing complete");

    await fileHandle.close();
    console.log("🔒 File closed");
  });

  stream.on("error", (err) => {
    console.error("❌ Error:", err);
  });

  writeBuff();
})();
