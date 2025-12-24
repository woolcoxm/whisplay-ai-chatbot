import { imageDir, cameraDir } from "./dir";
import fs from "fs";
import path from "path";

export const genImgList: string[] = [];
export const capturedImgList: string[] = [];

let latestDisplayImg = "";
let latestShowedImg = "";

const setLatestShowedImage = (imagePath: string) => {
  latestShowedImg = imagePath;
};

// 加载最新生成的图片路径到list中
const loadLatestGenImg = async () => {
  try {
    const files = await fs.promises.readdir(imageDir);
    const imagesWithStats = await Promise.all(
      files
        .filter((file) => /\.(jpg|png)$/.test(file))
        .map(async (file) => {
          const filePath = path.join(imageDir, file);
          const stats = await fs.promises.stat(filePath);
          return { file, mtime: stats.mtime.getTime() };
        })
    );

    const images = imagesWithStats
      .sort((a, b) => a.mtime - b.mtime)
      .map((item) => path.join(imageDir, item.file));

    genImgList.push(...images);
  } catch (error) {
    console.error("Error loading generated images:", error);
  }
};

// 加载最新拍摄的图片路径到list中
const loadLatestCapturedImg = async () => {
  try {
    const files = await fs.promises.readdir(cameraDir);
    const imagesWithStats = await Promise.all(
      files
        .filter((file) => /\.(jpg|png)$/.test(file))
        .map(async (file) => {
          const filePath = path.join(cameraDir, file);
          const stats = await fs.promises.stat(filePath);
          return { file, mtime: stats.mtime.getTime() };
        })
    );

    const images = imagesWithStats
      .sort((a, b) => a.mtime - b.mtime)
      .map((item) => path.join(cameraDir, item.file));

    capturedImgList.push(...images);
  } catch (error) {
    console.error("Error loading captured images:", error);
  }
};

export const initImageLists = async () => {
  await Promise.all([loadLatestGenImg(), loadLatestCapturedImg()]);
};

export const setLatestGenImg = (imgPath: string) => {
  genImgList.push(imgPath);
  latestDisplayImg = imgPath;
};

export const getLatestDisplayImg = () => {
  const img = latestDisplayImg;
  latestDisplayImg = "";
  return img;
};

export const showLatestGenImg = () => {
  if (genImgList.length !== 0) {
    latestDisplayImg = genImgList[genImgList.length - 1] || "";
    if (latestDisplayImg) {
      setLatestShowedImage(latestDisplayImg);
    }
    return !!latestDisplayImg;
  } else {
    return false;
  }
};

export const getLatestGenImg = () => {
  return genImgList.length !== 0 ? genImgList[genImgList.length - 1] : "";
};

export const setLatestCapturedImg = (imgPath: string) => {
  capturedImgList.push(imgPath);
  setLatestShowedImage(imgPath);
};

export const getLatestCapturedImg = () => {
  return capturedImgList.length !== 0
    ? capturedImgList[capturedImgList.length - 1]
    : "";
};

export const showLatestCapturedImg = () => {
  if (capturedImgList.length !== 0) {
    latestDisplayImg = capturedImgList[capturedImgList.length - 1] || "";
    if (latestDisplayImg) {
      setLatestShowedImage(latestDisplayImg);
    }
    return !!latestDisplayImg;
  } else {
    return false;
  }
};

export const getLatestShowedImage = () => {
  return latestShowedImg;
};

export const getImageMimeType = (imagePath: string): string => {
  const ext = path.extname(imagePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".bmp":
      return "image/bmp";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
};
