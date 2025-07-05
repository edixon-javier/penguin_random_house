import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 reactStrictMode: true,
 images: {
   domains: ['pxanlbqmkzsbhkahdzux.supabase.co'],
 },
 // Especificar directorio de origen
 distDir: '.next',
};

export default nextConfig;
