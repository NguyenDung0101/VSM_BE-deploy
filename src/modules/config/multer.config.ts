import { MulterModuleOptions } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

const createFolder = (folder: string) => {
  if (!existsSync(folder)) {
    mkdirSync(folder);
  }
};

const imageFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const multerConfig: MulterModuleOptions = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      const uploadPath = './uploads';
      createFolder(uploadPath);
      callback(null, uploadPath);
    },
    filename: editFileName,
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 1000000 }, // Giới hạn 1MB
};