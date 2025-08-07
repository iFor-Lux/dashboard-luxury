/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'clipboard-write=(self "https://*.vercel.app")',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
