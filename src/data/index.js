// Nạp mọi file JSON trong thư mục questions/. Thêm file mới là tự được nạp, không cần sửa ở đây.
import catalog from "./catalog.json";
import { createBank } from "../core/bank.js";

const files = import.meta.glob("./questions/*.json", { eager: true, import: "default" });

export const questionFiles = files;
export const bank = createBank(catalog, Object.values(files).flat());
