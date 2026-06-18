FROM node:20-alpine AS build

# Build the React app in a lightweight Node image.
WORKDIR /app

# Install exact frontend dependencies from the lock file.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild esbuild

# Copy the app source after dependencies are installed.
COPY . .

# Vite bakes the backend URL into the production bundle.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Create static files in /app/dist.
RUN npm run build

FROM nginx:alpine

# Serve the built React app with nginx.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# nginx listens on port 80 inside the container.
EXPOSE 80

# Keep nginx running in the foreground for Docker.
CMD ["nginx", "-g", "daemon off;"]
