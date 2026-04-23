import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { recoverAddress, hashMessage } from "ethers";
import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";

const router: ExpressRouter = Router();

const verifyWalletSchema = z.object({
  address: z.string(),
  signature: z.string(),
});

const userRegisterSchema = z.object({
  walletaddress: z.string().startsWith("0x", "Invalid wallet address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phonenumber: z.string().min(10, "Phone number must be at least 10 digits"),
  signature: z.string(),
});

const merchantRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessname: z.string().min(2),
  businesstype: z.string(),
  phonenumber: z.string().min(10),
  walletaddress: z.string().startsWith("0x"),
});

router.post("/user-register", async (req, res, next) => {
  try {
    const { walletaddress, name, phonenumber, signature } =
      userRegisterSchema.parse(req.body);

    const message = `Register to AxPesa: ${walletaddress.toLowerCase()}`;
    let recoveredAddress;
    try {
      const messageHash = hashMessage(message);
      recoveredAddress = recoverAddress(messageHash, signature);
    } catch {
      throw createError("Invalid signature", 401, "INVALID_SIGNATURE");
    }

    if (recoveredAddress.toLowerCase() !== walletaddress.toLowerCase()) {
      throw createError(
        "Signature verification failed",
        401,
        "INVALID_SIGNATURE",
      );
    }

    const existing = await prisma.user.findUnique({
      where: { walletaddress: walletaddress.toLowerCase() },
    });
    if (existing) {
      throw createError("Wallet already registered", 400, "WALLET_EXISTS");
    }

    const user = await prisma.user.create({
      data: {
        walletaddress: walletaddress.toLowerCase(),
        name,
        phonenumber,
      },
    });

    const token = jwt.sign(
      { userId: user.id, walletaddress: user.walletaddress, type: "wallet" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          walletaddress: user.walletaddress,
          name: user.name,
          phonenumber: user.phonenumber,
          kyctier: user.kyctier,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/verify-wallet", async (req, res, next) => {
  try {
    const { address, signature } = verifyWalletSchema.parse(req.body);

    const message = `Sign this message to login to AxPesa: ${address.toLowerCase()}`;

    let recoveredAddress: string;
    try {
      const messageHash = hashMessage(message);
      recoveredAddress = recoverAddress(messageHash, signature);
    } catch {
      throw createError("Invalid signature format", 401, "INVALID_SIGNATURE");
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw createError("Invalid signature", 401, "INVALID_SIGNATURE");
    }

    let user = await prisma.user.findUnique({
      where: { walletaddress: address.toLowerCase() },
    });

    if (!user) {
      throw createError(
        "User not registered. Please create an account first.",
        404,
        "USER_NOT_REGISTERED",
      );
    }

    const token = jwt.sign(
      { userId: user.id, walletaddress: user.walletaddress, type: "wallet" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          walletaddress: user.walletaddress,
          name: user.name,
          phonenumber: user.phonenumber,
          kyctier: user.kyctier,
        },
        type: "wallet",
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/merchant-register", async (req, res, next) => {
  try {
    const data = merchantRegisterSchema.parse(req.body);

    const existing = await prisma.merchant.findUnique({
      where: { email: data.email },
    });
    if (existing)
      throw createError("Email already registered", 400, "EMAIL_EXISTS");

    const passwordhash = await bcrypt.hash(data.password, 12);

    const merchant = await prisma.merchant.create({
      data: {
        email: data.email,
        passwordhash,
        businessname: data.businessname,
        businesstype: data.businesstype,
        phonenumber: data.phonenumber,
        walletaddress: data.walletaddress,
      },
    });

    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email, type: "email" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      data: {
        token,
        merchant: {
          id: merchant.id,
          email: merchant.email,
          businessname: merchant.businessname,
          walletaddress: merchant.walletaddress,
        },
        type: "email",
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = z
      .object({
        email: z.string().email(),
        password: z.string(),
      })
      .parse(req.body);

    const merchant = await prisma.merchant.findUnique({
      where: { email: data.email },
    });
    if (!merchant)
      throw createError("Invalid credentials", 401, "INVALID_CREDENTIALS");

    const valid = await bcrypt.compare(data.password, merchant.passwordhash);
    if (!valid)
      throw createError("Invalid credentials", 401, "INVALID_CREDENTIALS");

    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email, type: "email" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      data: {
        token,
        merchant: {
          id: merchant.id,
          email: merchant.email,
          businessname: merchant.businessname,
          walletaddress: merchant.walletaddress,
        },
        type: "email",
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) throw createError("Unauthorized", 401);

    const decoded = jwt.verify(
      auth.split(" ")[1],
      process.env.JWT_SECRET || "secret",
    ) as {
      merchantId?: string;
      userId?: string;
      walletaddress?: string;
      type: string;
    };

    if (decoded.type === "wallet" && decoded.userId) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          walletaddress: true,
          kyctier: true,
          phonenumber: true,
          createdat: true,
        },
      });
      if (!user) throw createError("User not found", 404);
      return res.json({ success: true, data: { ...user, type: "wallet" } });
    }

    if (decoded.merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: decoded.merchantId },
        select: {
          id: true,
          email: true,
          businessname: true,
          businesstype: true,
          walletaddress: true,
          kycstatus: true,
          isactive: true,
          createdat: true,
        },
      });
      if (!merchant) throw createError("Merchant not found", 404);
      return res.json({ success: true, data: { ...merchant, type: "email" } });
    }

    throw createError("Unauthorized", 401);
  } catch (err) {
    next(err);
  }
});

export default router;