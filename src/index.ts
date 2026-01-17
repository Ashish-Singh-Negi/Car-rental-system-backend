import express from "express";
import bcrypt from "bcrypt";
import { errorResponse, successResponse } from "./utils/responses.js";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "./utils/generateToken.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

export const app = express();
app.use(express.json());

app.post("/auth/signup", async (req, res) => {
  const { username, password } = req.body;

  await prisma.user.findFirst({
    where: {
      id: 108,
    },
  });

  if (!username || !password) {
    return res.status(400).json(errorResponse("invalid inputs"));
  }

  const usernameExist = await prisma.user.findFirst({
    where: {
      username,
    },
    select: {
      username: true,
    },
  });

  if (usernameExist)
    return res.status(409).json(errorResponse("username already exists"));

  const hashedPass = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPass,
    },
    omit: {
      password: true,
    },
  });

  res
    .status(201)
    .json(successResponse("User signup successfully", { userId: user.id }));
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  // validate
  if (!username || !password) {
    return res.status(400).json(errorResponse("invalid inputs"));
  }

  // find username in DB
  const user = await prisma.user.findFirst({
    where: {
      username,
    },
  });

  if (!user) return res.status(401).json(errorResponse("user does not exist"));

  // check password match or not
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch)
    return res.status(401).json(errorResponse("incorrect password"));

  // generate token
  const token = generateToken({
    userId: user.id,
    username: user.username,
  });

  res.status(200).json(successResponse("signin successfully", { token }));
});

export function calculateBookingCost(days: number, rentPerday: number) {
  return days * rentPerday;
}

app.post("/bookings", authMiddleware, async (req, res) => {
  const { carName, days, rentPerDay } = req.body;

  if (!carName || !days || !rentPerDay)
    return res.status(400).json(errorResponse("invalid inputs"));

  if (days < 0 || days > 365 || rentPerDay < 0 || rentPerDay > 2000)
    return res.status(400).json(errorResponse("invalid inputs"));

  try {
    const booking = await prisma.booking.create({
      data: {
        user_id: req.user.userId,
        car_name: carName,
        days: days,
        rent_per_day: rentPerDay,
        status: "booked",
      },
    });

    const bookingCost = calculateBookingCost(days, rentPerDay);

    res.status(201).json(
      successResponse("Booking created successfully", {
        bookingId: booking.id,
        totalCost: bookingCost,
      }),
    );
  } catch (error) {
    console.log(error);
  }
});

app.get("/bookings/:id", authMiddleware, async (req, res) => {
  const bid = Number(req.params.id);
  const isSummaryTrue = (req.query.summary && true) || false;

  if (!isSummaryTrue) {
    const bookingRecord = await prisma.booking.findFirst({
      where: {
        id: bid,
      },
      omit: {
        user_id: true,
      },
    });
    if (!bookingRecord)
      return res.status(404).json(errorResponse("bookingId not found"));

    res.status(200).json(
      successResponse(`Booking ${bid} found`, {
        ...bookingRecord,
        totalCost: bookingRecord.days * bookingRecord.rent_per_day,
      }),
    );
  }

  const bookingRecords = await prisma.booking.findMany({
    where: {
      user_id: req.user.userId,
    },
  });
  if (!bookingRecords.length) {
    return res.status(404).json(errorResponse("Bookings not found"));
  }

  const totalBookings = bookingRecords.length;

  let totalAmountSpent = 0;
  bookingRecords.forEach((booking) => {
    totalAmountSpent = totalAmountSpent + booking.days * booking.rent_per_day;
  });

  return res.status(200).json(
    successResponse("Bookings summary", {
      userId: req.user.userId,
      username: req.user.username,
      totalBookings,
      totalAmountSpent,
    }),
  );
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log("Server is listening at http://localhost:" + PORT);
});
