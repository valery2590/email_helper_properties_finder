# PropFinder BCN - Recomendador & Filtro Inmobiliario Serverless

Aplicación serverless desarrollada con **Next.js 16 (App Router)** y **TypeScript** para evaluar, filtrar y recomendar oportunidades de compra inmobiliaria en Barcelona y Cataluña.

---

## 📌 Perfil Financiero y Reglas del Comprador

- **Sueldo neto mensual:** 3.250 € / mes
- **Capacidad de ahorro mensual:** 2.500 € / mes (*cobro e ingreso el día 1 de cada mes*)
- **Ahorro líquido actual acumulado:** **32.629 €**
  - Trade Republic (Cuenta remunerada): `20.450 €`
  - Revolut (Cuenta remunerada): `5.900 €`
  - Trade Republic (ETFs): `2.800 €`
  - Banco Sabadell (Cuenta remunerada): `3.154 €`
  - Bitpanda (Criptos): `325 €`
- **Entrada hipotecaria (LTV 80%):** 20.0% del precio del inmueble
- **Fiscalidad en Cataluña (ITP y gastos):** 11.5% (10% ITP general Cataluña + ~1.5% notaría, registro, gestoría y tasación)
- **Capital inicial total requerido:** 31.5% del precio de compra
- **Sistema de amortización:** Sistema Francés (cuota periódica fija mensual con amortización creciente de capital e intereses decrecientes)
- **Criterios de viabilidad bancaria (DTI):**
  - **Saludable (< 33%):** Cuota mensual ≤ 1.072,50 € *(Inmuebles hasta ~326.270 € a 30 años al 2.8% TIN)*
  - **Riesgo Moderado (33% - 40%):** Cuota mensual entre 1.072,50 € y 1.300,00 € *(Inmuebles hasta ~395.478 €)*
  - **No Viable (> 40%):** Cuota mensual > 1.300,00 € *(Supera el límite de riesgo bancario)*

- **Opciones de Financiación (Banca vs. Broker):**
  - **80% LTV (Banca Tradicional):** Entrada 20% + 11.5% ITP/gastos = 31.5% capital inicial.
  - **90% LTV (Broker Hipotecario):** Entrada 10% + 11.5% ITP/gastos = 21.5% capital inicial.
  - **95% LTV (Broker Avanzado):** Entrada 5% + 11.5% ITP/gastos = 16.5% capital inicial.
  - **100% LTV (Broker 100%):** Entrada 0% + 11.5% ITP/gastos = 11.5% capital inicial *(¡Permite comprar de inmediato con los 32.629 € actuales!)*.

- **Idiomas Soportados:** Español (ES 🇪🇸) e Italiano (IT 🇮🇹) con selector instantáneo.

---

## 🚀 Arquitectura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   └── webhook/
│   │       └── route.ts         # Endpoint serverless HTTP POST/GET (bilingüe ES/IT)
│   ├── globals.css              # Estilos globales con Tailwind CSS
│   ├── layout.tsx               # Metadatos y estructura raíz
│   └── page.tsx                 # Dashboard interactivo con simulador, broker y tester
└── lib/
    ├── financial-engine.ts      # Motor matemático de viabilidad, escenarios 80-100% y amortización francesa
    ├── html-parser.ts           # Extractor de datos inmobiliarios desde HTML con Cheerio
    └── i18n.ts                  # Diccionarios de traducción completos en Español e Italiano
```

---

## 📡 Webhook API (`/api/webhook`)

### `GET /api/webhook`
Devuelve el estado del servicio, los límites de presupuesto calculados y las instrucciones de uso.

### `POST /api/webhook`
Recibe datos de pisos para su evaluación financiera automática. Acepta:
1. Objeto individual de piso en JSON.
2. Array de pisos en JSON (`{ "properties": [...] }` o `[...]`).
3. Notificaciones HTML de alertas por correo de portales inmobiliarios (Idealista, Fotocasa, Habitaclia) parseadas automáticamente con `cheerio`.

#### Ejemplo de Petición JSON:
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "properties": [
      {
        "title": "Piso luminoso en Gràcia con balcón",
        "price": 245000,
        "district": "Gràcia",
        "m2": 68,
        "rooms": 2
      }
    ]
  }'
```

---

## 🛠️ Comandos

```bash
# Instalar dependencias
npm install

# Compilar proyecto y verificar tipos
npm run build

# Iniciar servidor de desarrollo
npm run dev

# Iniciar servidor de producción
npm run start
```
