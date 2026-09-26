import { createShortUrl, getUrlByShortCode } from "./url.service.js";

export const create = async (req, res, next) => {
  try {
    const { longUrl } = req.validatedData;

    const url = await createShortUrl(longUrl);

    res.status(201).json({
      status: "success",
      data: {
        id: url.id,
        shortCode: url.shortCode,
        longUrl: url.longUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

export const redirect = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    const url = await getUrlByShortCode(shortCode);

    if(!url){
      return res.status(404).json({
        status: "error",
        message: "Short URL not found or expired",
      });
    }

    // incrementClickCount(url.id);

    return res.redirect(302, url.longUrl);
  } catch (error) {
    next(error);
  }
}