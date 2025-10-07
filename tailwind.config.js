/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // BẮT BUỘC: Thêm prefix để tránh xung đột với các class của Ant Design (antd)
  prefix: 'tw-', 
  corePlugins: {
    preflight: true,
  }
}