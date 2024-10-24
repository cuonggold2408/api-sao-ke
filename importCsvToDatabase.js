const fs = require("fs");
const path = require("path");
const { Transaction, sequelize } = require("./models"); // Import model Transaction

// Hàm chuyển dữ liệu từ CSV vào PostgreSQL
const importCsvToDatabase = async () => {
  const databasePath = path.join(__dirname, "database.csv");
  const csvData = fs.readFileSync(databasePath, "utf8");

  const transactions = csvData.split("\n").map((line) => {
    const [date, bank, id, money, description] = line.split(",");
    return { date, bank, transaction_code: id, money, description };
  });

  try {
    await sequelize.sync();

    // Nhập dữ liệu từng phần nhỏ (ví dụ: 500 bản ghi một lần)
    const batchSize = 500;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await Transaction.bulkCreate(batch);
      console.log(`Inserted batch ${i / batchSize + 1}`);
    }

    console.log("Data has been inserted successfully!");
  } catch (error) {
    console.error("Error importing data from CSV:", error);
  }
};

// Xuất hàm để sử dụng trong app.js
module.exports = importCsvToDatabase;
