import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  /* Các config cũ của bạn nếu có sẽ nằm ở đây */
};

export default withNextIntl(nextConfig);