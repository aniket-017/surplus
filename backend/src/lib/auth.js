import jwt from "jsonwebtoken";

const userSelect = {
  id: true,
  email: true,
  phone: true,
  firebaseUid: true,
  name: true,
  avatarUrl: true,
  role: true,
  address: true,
  isDeleted: true,
  deletedAt: true,
  deletedReason: true,
  isSuperAdmin: true,
  isBanned: true,
  bannedAt: true,
  bannedReason: true,
  createdAt: true,
};

export function formatUser(user) {
  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role ? user.role.toLowerCase() : null,
    address: user.address ?? null,
    isDeleted: Boolean(user.isDeleted),
    deletedAt: user.deletedAt ?? null,
    deletedReason: user.deletedReason ?? null,
    isSuperAdmin: Boolean(user.isSuperAdmin),
    isBanned: Boolean(user.isBanned),
    bannedAt: user.bannedAt ?? null,
    bannedReason: user.bannedReason ?? null,
    createdAt: user.createdAt,
  };
}

export function parseUserAddress(raw) {
  if (raw === undefined) {
    return undefined;
  }

  if (raw === null) {
    return null;
  }

  let parsed = raw;
  if (typeof raw === "string") {
    parsed = JSON.parse(raw);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid address");
  }

  const latitudeRaw = parsed.latitude;
  const longitudeRaw = parsed.longitude;
  const hasCoordinates = latitudeRaw !== undefined || longitudeRaw !== undefined;

  let latitude = null;
  let longitude = null;

  if (hasCoordinates) {
    latitude = Number(latitudeRaw);
    longitude = Number(longitudeRaw);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("Latitude and longitude must be valid numbers");
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error("Latitude must be between -90 and 90");
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error("Longitude must be between -180 and 180");
    }
  }

  const address = {
    address: parsed.address ? String(parsed.address).trim() : null,
    city: String(parsed.city || "").trim(),
    state: String(parsed.state || "").trim(),
    pincode: String(parsed.pincode || "").trim(),
    latitude,
    longitude,
  };

  if (!address.city || !address.state || !address.pincode) {
    throw new Error("City, state, and pincode are required");
  }

  return address;
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      name: user.name,
      role: user.role ? user.role.toLowerCase() : null,
      isSuperAdmin: Boolean(user.isSuperAdmin),
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export function setAuthCookie(res, user) {
  const token = signToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
}

export function clearAuthCookie(res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
}

export { userSelect };
