// Make sure to include these imports:
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs"); // Import fs to handle file system operations
const path = require("path");

// Initialize GoogleGenerativeAI with the API key
const genAI = new GoogleGenerativeAI(
  process.env.API_KEY || "AIzaSyAFDyshkjuRtGoQ5OmJWgxq3Oe1bupPcHI"
);

// Get the generative model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-exp-0801" });

// Function to convert file to generative part
// function urlToGenerativePart(imageUrl, mimeType) {
//   return {
//     externalData: {
//       uri: imageUrl,
//       mimeType,
//     },
//   };
// }
const axios = require("axios");

async function fetchImageFromUrl(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary").toString("base64");
}

// async function generateContent({ imageUrl }) {
//   try {
//     const prompt =
//       "Hãy đưa ra 3 thông tin với cấu trúc như sau:{bank: (tên ngân hàng chuyển đến hoặc là ngân hàng thụ hưởng hãy viết tắt: BIDV, VCB, Agri, Vietin), money: (bỏ VND), desc: (nội dung chuyển khoản không ghi dấu)} Hãy đưa ra tất cả các kết quả có độ chính xác cao nhất cho tôi, cao nhất ở đầu tiên";

//     // Fetch image data from URL and convert to base64
//     console.log("🚀 ~ generateContent ~ imageUrl:", imageUrl);
//     const base64Image = await fetchImageFromUrl(imageUrl);

//     // Prepare image part for the request using base64 data
//     const imagePart = {
//       inlineData: {
//         data: base64Image,
//         mimeType: "image/jpeg",
//       },
//     };

//     // Use await inside the async function to generate content
//     const result = await model.generateContent([prompt, imagePart]);

//     // Log the response text
//     console.log(result.response.text());
//     return result.response.text();
//   } catch (error) {
//     console.error("Error generating content:", error);
//   }
// }

function parseToJson(responseText) {
  // Nếu `responseText` là một đối tượng hợp lệ, trả về nó ngay lập tức
  if (typeof responseText === "object") {
    return responseText;
  }

  // Xử lý chuỗi JSON nếu `responseText` là chuỗi
  try {
    // Loại bỏ các ký tự không hợp lệ có thể có ở đầu hoặc cuối chuỗi
    const cleanedResponse = responseText
      .replace(/```json/, "") // Loại bỏ ký tự mở đầu không hợp lệ
      .replace(/```/, "") // Loại bỏ ký tự đóng không hợp lệ
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Đảm bảo tên thuộc tính có dấu ngoặc kép
      .replace(/:\s*([a-zA-Z0-9_]+)\s*([,}])/g, ':"$1"$2') // Đảm bảo giá trị có dấu ngoặc kép nếu cần
      .trim(); // Loại bỏ khoảng trắng dư thừa

    // Parse chuỗi đã làm sạch thành đối tượng JSON
    const parsedObject = JSON.parse(cleanedResponse);
    return parsedObject;
  } catch (error) {
    console.error("Error parsing responseText:", error);
    return {};
  }
}

async function generateContent({ imageUrl }) {
  try {
    const prompt = `Hãy đưa ra 1 kết quả duy nhất với cấu trúc như sau:
      { bank: (tên ngân hàng chuyển đến hoặc là ngân hàng thụ hưởng hãy viết tắt: BIDV, VCB, Agri, Vietin), 
       money: (bỏ VND, bỏ dấu phẩy, bỏ dấu chấm), 
       desc: (nội dung chuyển khoản không ghi dấu, ghi trên 1 dòng , giữ nguyên dấu cách và xóa hết số ở cuối nếu có)
       }.
       Đảm bảo rằng kết quả này có độ chính xác cao nhất, ngân hàng và số tiền phải chính xác. Lưu ý tên ngân hàng viết tương tự ví dụ như ngân hàng ngoại thương sẽ là vcb, ngân hàng công thương là vietin...`;

    // Fetch image data from URL and convert to base64
    const base64Image = await fetchImageFromUrl(imageUrl);

    // Prepare image part for the request using base64 data
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg",
      },
    };

    // Use await inside the async function to generate content
    const result = await model.generateContent([prompt, imagePart]);

    // Log the response text
    const responseText = result.response.text();
    console.log(responseText);

    // Assuming the API can return multiple results, pick the first one
    const bestResult = Array.isArray(responseText)
      ? responseText[0]
      : responseText;
    const parsedResult = parseToJson(bestResult);
    return parsedResult;
  } catch (error) {
    console.error("Error generating content:", error);
  }
}

module.exports = { generateContent };
