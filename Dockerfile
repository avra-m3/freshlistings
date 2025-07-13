# Use an official Deno image.
FROM denoland/deno:2.4.1

# Set the working directory in the container.
WORKDIR /app

# Copy the dependency manifest.
COPY deno.json .

# Cache the dependencies.
# This will download all the dependencies and cache them.
RUN deno install --frozen

# Copy the rest of the application code.
COPY . .

# Build the application for production.
RUN deno task build

# Define the command to run the application.
CMD ["run", "-A", "main.ts"]
