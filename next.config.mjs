/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a fully static site into ./out for Firebase Hosting.
  output: "export",
  // Static export can't use the Next image optimizer; we don't use next/image
  // anyway, but this keeps the door open without a build error.
  images: { unoptimized: true },
};

export default nextConfig;
