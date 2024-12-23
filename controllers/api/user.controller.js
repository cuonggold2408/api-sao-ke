const { successResponse, errorResponse } = require("../../utils/response");
const { Transaction, Sequelize, Storage } = require("../../models/index");
const { Op } = require("sequelize");
const { generateContent } = require("../../utils/generateContent");

module.exports = {
  profile: (req, res) => {
    return successResponse(res, 200, "ok");
  },
  transactions: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await Transaction.findAndCountAll({
        limit: limit,
        offset: offset,
        order: [["id", "ASC"]],
      });

      // Tính tổng số trang
      const totalPages = Math.ceil(count / limit);

      const data = {
        transactions: rows,
        totalPages: totalPages,
        currentPage: page,
      };

      return successResponse(res, 200, data);
    } catch (error) {
      return errorResponse(res, 500, error.message);
    }
  },
  searchData: async (req, res) => {
    const { money, transaction_code, bank, description, date } = req.query; // Nhận các query parameters
    const page = parseInt(req.query.page) || 1;

    try {
      // Tạo điều kiện tìm kiếm dựa trên các tham số đã nhận
      const searchConditions = {};

      if (money) {
        searchConditions.money = money; // Tìm theo money
      }

      if (transaction_code) {
        searchConditions.transaction_code = transaction_code; // Tìm theo transaction_code
      }

      if (date) {
        searchConditions.date = date; // Tìm theo date
      }

      if (bank) {
        const bankArray = bank.split(","); // Tách các giá trị ngân hàng thành mảng
        searchConditions.bank = {
          [Op.or]: bankArray.map((b) => ({
            [Op.iLike]: `%${b}%`, // Tìm không phân biệt chữ hoa chữ thường
          })),
        };
      }

      if (description) {
        searchConditions.description = {
          [Op.iLike]: `%${description}%`, // Không phân biệt chữ hoa/chữ thường
        };
      }

      // Đếm tổng số bản ghi phù hợp với điều kiện tìm kiếm
      const totalItems = await Transaction.count({
        where: searchConditions,
      });

      // Tính tổng số trang
      const totalPages = Math.ceil(totalItems / 20);

      // Tìm các giao dịch dựa trên các điều kiện tìm kiếm
      const transactions = await Transaction.findAll({
        where: searchConditions,
        attributes: [
          "money",
          "bank",
          "transaction_code",
          "description",
          "date",
          "id",
        ],
        limit: 20, // Giới hạn số lượng bản ghi trả về mỗi lần truy vấn
        offset: (page - 1) * 20, // Tính offset dựa trên trang hiện tại
      });

      if (!transactions || transactions.length === 0) {
        return errorResponse(res, 404, "Không tìm thấy giao dịch nào");
      }

      const data = {
        transactions: transactions,
        totalPages: totalPages,
        currentPage: page,
      };

      return successResponse(res, 200, data);
    } catch (error) {
      return errorResponse(res, 500, error.message);
    }
  },
  topServer: async (req, res) => {
    try {
      const topServer = await Transaction.findAll({
        attributes: ["money", "description", "bank"],
        limit: 50,
        order: [[Sequelize.literal('CAST("money" AS DECIMAL)'), "DESC"]],
      });

      return successResponse(res, 200, topServer);
    } catch (error) {
      return errorResponse(res, 500, error.message);
    }
  },
  uploadImage: async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return errorResponse(res, 400, "URL của hình ảnh là bắt buộc.");
      }

      await Storage.create({
        url_image: url,
      });

      const result = await generateContent({ imageUrl: url });

      console.log("Image URL saved:", result);
      const bank = result?.bank;
      const money = result?.money;
      const desc = result?.desc;

      const transactions = await Transaction.findAll({
        where: {
          [Op.and]: [
            { description: { [Op.iLike]: `%${desc}%` } }, // Tìm các bản ghi có chứa một phần hoặc toàn bộ 'desc'
            { money: { [Op.eq]: money } }, // Tìm các bản ghi có số tiền khớp chính xác
            { bank: { [Op.iLike]: `%${bank}%` } }, // Tìm các bản ghi có chứa một phần hoặc toàn bộ 'bank'
          ],
        },
        attributes: ["money", "bank", "description"],
      });

      console.log("Transactions found:", transactions);

      return successResponse(
        res,
        200,
        "Lưu hình ảnh thành công.",
        transactions
      );
    } catch (error) {
      console.error("Error saving image URL:", error);
      return errorResponse(res, 500, "Đã xảy ra lỗi khi lưu hình ảnh.");
    }
  },
};
