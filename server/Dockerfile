# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore (copy csproj first for layer caching)
COPY DistroLedger.slnx .
COPY DistroLedger.Domain/DistroLedger.Domain.csproj DistroLedger.Domain/
COPY DistroLedger.Infrastructure/DistroLedger.Infrastructure.csproj DistroLedger.Infrastructure/
COPY DistroLedger.Api/DistroLedger.Api.csproj DistroLedger.Api/
COPY DistroLedger.Tests/DistroLedger.Tests.csproj DistroLedger.Tests/
RUN dotnet restore DistroLedger.Api/DistroLedger.Api.csproj

# Build + publish
COPY . .
RUN dotnet publish DistroLedger.Api/DistroLedger.Api.csproj -c Release -o /app /p:UseAppHost=false

# ---- runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .

# Render/Fly inject PORT; shell-form CMD expands it (default 8080).
EXPOSE 8080
CMD ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet DistroLedger.Api.dll
