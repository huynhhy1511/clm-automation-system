# Build stage: Cài đặt thư viện và build file tĩnh của React
FROM node:18-alpine as build
WORKDIR /app

# Copy các file cần thiết
COPY package*.json ./
RUN npm install

# Copy source code và tiến hành gọi lệnh build Vite
COPY . .
RUN npm run build

# Serve stage: Sử dụng Nginx để host các file tĩnh
FROM nginx:alpine

# Xóa trang mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy thư mục build từ stage trên (Vite mặc định nhả ra folder /app/dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port mặc định của Nginx
EXPOSE 80

# Lệnh này giữ cho dịch vụ của Nginx chạy dưới nền hoài
CMD ["nginx", "-g", "daemon off;"]
