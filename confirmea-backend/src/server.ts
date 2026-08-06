import "dotenv/config";
import express from "express";
import cors from "cors";
import "./db/index.js"; // opens the DB and applies schema.sql on import

import authRoutes from "./routes/auth.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import businessesRoutes from "./routes/businesses.routes.js";
import listingsRoutes from "./routes/listings.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import complaintsRoutes from "./routes/complaints.routes.js";
import businessSelfServiceRoutes from "./routes/business.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/applications", applicationsRoutes);
app.use("/businesses", businessesRoutes);
app.use("/listings", listingsRoutes);
app.use("/bookings", bookingsRoutes);
app.use("/complaints", complaintsRoutes);
app.use("/business", businessSelfServiceRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Confirmea backend running at http://localhost:${PORT}`);
});
