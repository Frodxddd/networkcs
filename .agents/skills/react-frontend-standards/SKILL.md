---
name: react-frontend-standards
description: มาตรฐานการเขียนโค้ด React Frontend (Next.js App Router + TypeScript) ครอบคลุมโครงสร้างโฟลเดอร์ การตั้งชื่อ การแยก Component/Hook/Service/Store กฎ TypeScript และ Git workflow. Use this skill whenever the user writes, reviews, refactors or scaffolds React or Next.js code, creates a component, hook, page, store or API service, asks where a file should go, how to organize a React project, whether to use global state or a hook, or wants code that is easy to maintain, even if they don't mention "standards" or "guidelines".
---

# React Frontend Standards

มาตรฐานนี้ใช้กับโปรเจกต์ Frontend ที่ใช้ Next.js (App Router) + React + TypeScript เป้าหมายคือให้โค้ดอ่านง่าย แก้ง่าย และทีมทำงานไปทิศทางเดียวกัน ก่อนเขียนหรือแก้โค้ด ให้ตรวจก่อนว่าโปรเจกต์มีโครงสร้างอยู่แล้วหรือไม่ และทำตามของเดิมเมื่อสอดคล้องกับมาตรฐานนี้ ถ้าขัดกัน ให้แจ้งผู้ใช้แทนที่จะรื้อเอง

## 1. Project Structure

```text
src/
├── app/                # Routing (App Router): page.tsx, layout.tsx, loading.tsx, error.tsx
├── components/
│   ├── ui/             # Base components ใช้ซ้ำทั้งแอป (Button, Input, Modal)
│   ├── layout/         # Navbar, Footer, Sidebar
│   └── [feature]/      # Components เฉพาะของแต่ละ Feature
├── hooks/              # Custom Hooks (State + Logic ที่ใช้ซ้ำ)
├── services/           # เรียก API แยกตาม feature
├── stores/             # Global State (Zustand)
├── types/              # TypeScript Interfaces & Types
├── lib/                # Config, API client, wrapper ของ library
├── utils/              # Pure helper functions
├── data/               # ข้อมูลคงที่ (รายการโปรเจกต์, เมนู)
└── styles/             # Global styles
```

เหตุผลที่แยกแบบนี้: ทุกครั้งที่ต้องแก้อะไร ควรรู้ได้ทันทีว่าไปที่ไหน แก้ข้อมูลไปที่ `data/` แก้หน้าตาไปที่ `components/` แก้การเรียก API ไปที่ `services/` ไม่ต้องไล่หาในไฟล์ใหญ่ไฟล์เดียว

ใช้ path alias `@/` แทน relative path ลึกๆ (`@/components/ui/button` ไม่ใช่ `../../../components/ui/button`)

## 2. Naming Conventions

| Target | Convention | Example |
|---|---|---|
| Folders | kebab-case | `user-profile/` |
| Files | kebab-case | `project-card.tsx`, `use-product-list.ts` |
| Components | PascalCase | `ProjectCard` |
| Hooks | camelCase ขึ้นต้นด้วย `use` | `useProductList` |
| Variables / Functions | camelCase | `getUserById`, `handleSubmit` |
| Interfaces / Types | PascalCase | `UserResponse` |
| Boolean | ขึ้นต้น `is` / `has` / `can` | `isOpen`, `hasError` |

ชื่อไฟล์ควรตรงกับชื่อ component หลักในไฟล์ (`project-card.tsx` → `ProjectCard`)

## 3. TypeScript

- ห้ามใช้ `any` ทุกกรณี ถ้าไม่รู้ type จริงๆ ใช้ `unknown` แล้ว narrow เอา เพราะ `any` ปิดการตรวจของ compiler ทำให้บั๊กหลุดไปถึง runtime
- ใช้ `interface` สำหรับ Object Shape (รวมถึง Props) และ `type` สำหรับ Union / Intersection
- Props ทุก component ต้องมี type
- ระบุ Return Type ให้ชัดเจนในฟังก์ชันที่มี logic ซับซ้อน และฟังก์ชัน async ทุกตัว

```tsx
// ❌
const getUser = async (id) => { ... }

// ✅
const getUser = async (id: number): Promise<UserResponse> => { ... }
```

```tsx
interface ProjectCardProps {
  title: string;
  tech: string[];
}

export function ProjectCard({ title, tech }: ProjectCardProps) {
  return <div>{title}</div>;
}
```

## 4. Component Rules

- ใช้ Function Component เท่านั้น ไม่ใช้ Class Component
- 1 ไฟล์ = 1 component หลัก
- Component ยาวเกิน ~100 บรรทัด หรือ JSX ซ้อนเกิน 3–4 ชั้น หรือมีโค้ดซ้ำ 3 ครั้งขึ้นไป ให้แยกออก
- Component มีหน้าที่แสดงผล ไม่เขียน logic ซับซ้อนหรือเรียก API ตรงๆ ให้ย้ายไป hook หรือ service
- ใน Next.js ค่าเริ่มต้นเป็น Server Component ใส่ `"use client"` เฉพาะ component ที่ต้องใช้ state, effect, event handler หรือ browser API เพราะยิ่งเป็น Client Component น้อย JS ที่ส่งไปเบราว์เซอร์ยิ่งน้อย ให้ดัน `"use client"` ลงไปที่ component เล็กๆ ที่ต้องใช้จริง ไม่ใส่ที่ระดับ page
- ห้ามใช้ index เป็น `key` ใน list ที่เพิ่ม/ลบ/เรียงลำดับได้ ใช้ id ที่คงที่

```tsx
// ❌ ทุกอย่างอยู่ใน page.tsx
export default function Page() {
  return (
    <div>
      <nav>...</nav>
      <section>...50 บรรทัด...</section>
      <section>...80 บรรทัด...</section>
    </div>
  );
}

// ✅ แยกเป็น component
export default function Page() {
  return (
    <>
      <Navbar />
      <Profile />
      <ProjectList />
    </>
  );
}
```

### แยกข้อมูลออกจาก UI

ข้อมูลที่เปลี่ยนบ่อย (รายการ, ข้อความ, ลิงก์) ให้อยู่ใน `data/` เพื่อให้เพิ่ม/แก้ที่เดียวโดยไม่ต้องแตะ JSX

```tsx
// data/projects.ts
export const projects: Project[] = [
  { id: 1, title: "เว็บร้านค้า", tech: ["Next.js", "Tailwind"] },
];

// components/home/project-list.tsx
import { projects } from "@/data/projects";

export function ProjectList() {
  return (
    <div>
      {projects.map((p) => (
        <ProjectCard key={p.id} {...p} />
      ))}
    </div>
  );
}
```

## 5. Layer Responsibilities

แต่ละ Layer มีหน้าที่เดียว ไม่ปนกัน เพื่อให้เปลี่ยนส่วนหนึ่งได้โดยไม่กระทบส่วนอื่น

| Layer | หน้าที่ | ห้าม |
|---|---|---|
| **Page** (`app/`) | ประกอบ component, กำหนด route | เขียน logic ซับซ้อน |
| **Component** | แสดงผล UI รับ props | เรียก API โดยตรง |
| **Hook** | State + Logic ที่ใช้ซ้ำ, จัดการ `isLoading` / `error` | ใส่ JSX |
| **Service** | เรียก API, คืนข้อมูลที่มี type | ใส่ State หรือ UI |
| **Store** | Global state | เก็บข้อมูลที่ใช้หน้าเดียว |

```tsx
// services/product-service.ts
export const productService = {
  async getAll(): Promise<Product[]> {
    const res = await apiClient.get<Product[]>("/products");
    return res.data;
  },
};
```

## 6. Store vs Hook

สร้าง Global Store เฉพาะเมื่อ State ต้องถูกแชร์ข้ามหลาย component ที่ไม่ใช่ parent-child หรือต้องคงอยู่ข้าม route ถ้าใช้ในหน้าเดียวหรือ component เดียว ใช้ Custom Hook + `useState` เพราะ global state ทำให้ตามยากว่าใครแก้ค่าตอนไหน ยิ่งน้อยยิ่งดูแลง่าย

```text
ข้อมูลนี้ถูกใช้ใน component มากกว่า 1 จุดที่ไม่ใช่ parent-child ?
 ├─ ไม่ใช่ → Hook + local state (หรือส่งผ่าน props)
 └─ ใช่ → ต้อง persist ข้าม route ?
      ├─ ใช่ → Store (Zustand)
      └─ ไม่ใช่ → Hook / Context ที่ scope แคบ
```

| เงื่อนไข | แนะนำ |
|---|---|
| ข้อมูล User ที่ Login (ใช้ทั้งแอป) | ✅ Store |
| ตะกร้าสินค้า (ใช้หลายหน้า) | ✅ Store |
| Theme / Locale | ✅ Store |
| Fetch ข้อมูลแสดงในหน้าเดียว | ❌ Hook |
| Form ที่ Submit แล้วจบ | ❌ Hook / local state |
| Modal / Dialog | ❌ local state |
| Dropdown options ที่ใช้ component เดียว | ❌ local state |

```tsx
// stores/auth-store.ts
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  login: async (credentials) => {
    const user = await authService.login(credentials);
    set({ currentUser: user, isAuthenticated: true });
  },
  logout: () => set({ currentUser: null, isAuthenticated: false }),
}));
```

ถ้าโปรเจกต์ใช้ TanStack Query (หรือ SWR) อยู่แล้ว ให้ใช้มันจัดการ server state (loading/error/cache) แทนการเขียน hook fetch เอง และเก็บ Store ไว้สำหรับ client state เท่านั้น

## 7. Custom Hook Guidelines

- ชื่อขึ้นต้นด้วย `use` เสมอ
- 1 hook = 1 หน้าที่
- Hook ที่เรียก API ต้องจัดการ `isLoading` และ `error` เสมอ
- โครงสร้างมาตรฐาน: State → Derived values → Methods → return เฉพาะที่ component ต้องใช้

```tsx
export function useProductList() {
  // 1. State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Derived
  const hasProducts = products.length > 0;

  // 3. Methods
  const fetchProducts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      setProducts(await productService.getAll());
    } catch {
      setError("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 4. Expose
  return { products, isLoading, error, hasProducts, fetchProducts };
}
```

## 8. Styling

- เลือกอย่างใดอย่างหนึ่งทั้งโปรเจกต์: Tailwind หรือ CSS Modules ให้ดูของที่โปรเจกต์ใช้อยู่แล้ว ถ้ายังไม่มี ถามผู้ใช้ก่อนเลือก
- ห้ามใช้ inline `style` ยกเว้นค่าที่เป็น dynamic จริงๆ
- สไตล์อยู่ใกล้ component ที่ใช้ ไม่กองรวมใน `globals.css`

## 9. Linting & Git Workflow

- ใช้ ESLint + Prettier ก่อน commit ทุกครั้งรัน `npm run lint` และห้าม commit โค้ดที่มี lint error
- ใช้ Conventional Commits:

| Prefix | การใช้งาน | ตัวอย่าง |
|---|---|---|
| `feat(scope):` | เพิ่มฟีเจอร์ | `feat(projects): add project card` |
| `fix(scope):` | แก้ bug | `fix(navbar): fix mobile menu overflow` |
| `refactor(scope):` | ปรับโค้ดโดยไม่เปลี่ยนพฤติกรรม | `refactor(home): extract hero section` |
| `docs(scope):` | เอกสาร | `docs(readme): update setup steps` |

### Pre-commit (Husky + lint-staged + commitlint)

```bash
npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
```

```json
{
  "scripts": { "prepare": "husky" },
  "lint-staged": {
    "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

- `.husky/pre-commit`: `npx lint-staged`
- `.husky/commit-msg`: `npx --no -- commitlint --edit $1`
- `commitlint.config.js`: `module.exports = { extends: ['@commitlint/config-conventional'] };`

## เมื่อนำไปใช้

1. เขียนโค้ดใหม่: วางไฟล์ตามโครงสร้างข้อ 1 ตั้งชื่อตามข้อ 2 และตัดสินใจ Store vs Hook ตามข้อ 6 ก่อนสร้าง store
2. รีวิวหรือ refactor โค้ดเดิม: ชี้จุดที่ไม่ตรงมาตรฐานพร้อมเหตุผลสั้นๆ และเสนอแก้ทีละจุด อย่าเขียนใหม่ทั้งไฟล์ถ้าผู้ใช้ไม่ได้ขอ
3. ถ้ามาตรฐานนี้ขัดกับสิ่งที่โปรเจกต์ใช้อยู่ (เช่น ใช้ Redux อยู่แล้ว) ให้ทำตามของโปรเจกต์และบอกผู้ใช้ว่าต่างจากมาตรฐานตรงไหน
