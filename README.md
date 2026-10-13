# BE'MOON — Визуальная локальная среда мастеров и ремесел

> **«Смотри, что умеют люди рядом»** — иммерсивная Pinterest-style платформа для локальных мастеров, ремесленников и бьюти-артистов с живыми видео-силуэтами и встроенной On-Device ChromaKey студией.

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](#)

---

## ✦ О проекте

**BE'MOON** переосмысляет презентацию локальных специалистов (барберов, тату-мастеров, керамистов, мебельщиков, шеф-кондитеров). Вместо скучных каталогов и табличных CRM-сервисов продукт предлагает люксовый визуальный опыт с эффектом «живого присутствия» мастера:

* **3D Overlap Silhouette**: Прозрачный силуэт мастера парит над типографикой имени и дышащей изумрудной неоновой аурой.
* **On-Device ChromaKey Studio**: Клиентский движок вырезания зелёного фона прямо в браузере (без обращения к тяжелым серверам) с экспортом прозрачного WebM-видео.
* **Cinematic Shutter Motion Blur (180°)**: Оптический кинематографический смаз затвора, дающий восприятие плавности 60+ FPS при ультралёгких 24 кадрах без нагрузки на мобильный процессор.
* **CineBloom Diffusion**: Пленочная оптическая диффузия Pro-Mist, устраняющая цифровую пикселизацию контуров силуэта.
* **Zero-Freeze Stitched Loops**: Бесшовная 4-сегментная сборка видеороликов с микро-наплывом на стыке лупа без рывков и замираний.
* **Adaptive Masonry Video Feed**: Виртуализированный пул видеоплееров с кинетическим таймингом и моментальной загрузкой превью.

---

## 🛠 Технологический стек

* **Frontend**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS v4, Lucide Icons, Syne & Plus Jakarta Sans typography
* **Media & Canvas Engine**: HTML5 Canvas 2D Engine, Web Audio API, MediaRecorder API, requestVideoFrameCallback
* **Architecture**: 100% Client-Side Self-Contained Prototype (Zero external dependencies)
* **Deployment Ready**: Оптимизировано под Vercel Edge (`vercel.json` SPA rewrites & byte-range video streaming)

---

## 🚀 Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/username/bemoon.git

# Перейти в каталог проекта
cd bemoon

# Установить зависимости
npm install

# Запустить локальный сервер разработки
npm run dev

# Собрать production-билд
npm run build
```

---

## 📱 Дизайн-концепт для портфолио

Проект разработан как флагманский интерактивный кейс в продуктовом портфолио, демонстрирующий синтез **High-End UI/UX (Apple / Telegram Originals aesthetics)** и передовых браузерных медиа-технологий на клиентском устройстве.
