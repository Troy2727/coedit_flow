@echo off
echo Stopping any running Next.js processes...
taskkill /f /im node.exe 2>nul

echo Clearing Next.js cache...
if exist ".next" (
  rmdir /s /q .next
  echo .next directory removed.
) else (
  echo .next directory not found, skipping.
)

echo Starting Next.js development server...
npm run dev
