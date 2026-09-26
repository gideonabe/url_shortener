import { nanoid } from "nanoid";
import prisma from "../../config/prisma.js";

export const createShortUrl = async (longUrl) => {
  const shortCode = nanoid(7);

  const url = await prisma.url.create({
    data: {
      longUrl,
      shortCode,
    },
  });

  return url;
}

export const getUrlByShortCode = async (shortCode) => {
  const url = await prisma.url.findUnique({
    where: {
      shortCode,
    },
  });

  if(!url) {
    return null;
  }

  if(url.expiresAt && url.expiresAt <= new Date()){
    return null;
  }

  return url;
}

// export const incrementClickCount = async (urlId) => {
//   return await prisma.url.update({
//     where: { id: urlId },
//     data: {
//       clicks: {
//         increment: 1,
//       },
//     },
//   });
// };