# ເວັບແຄັດຕາລັອກຮ້ານດອກໄມ້

- หน้าร้าน `/` — ลูกค้าดูแบบสินค้าแยกตามหมวด กดดูรายละเอียด แล้วทักร้าน (LINE / WhatsApp / Facebook / โทร)
- หลังบ้าน `/admin` — เพิ่ม/แก้ไข/ซ่อน/ลบสินค้า, จัดการหมวดหมู่, แก้ข้อมูลร้าน
- ภาษาลาว, ราคาแสดงแบบ `500.000 ₭`
- เว็บนิ่ง (static export) บน **Firebase Hosting** (Spark plan ฟรี) + ข้อมูล รูป ล็อกอิน บน **Supabase**

เว็บจริง: https://flower-store-71379.web.app

## ตั้งค่า Supabase (ครั้งเดียว)

1. **SQL Editor** → วางทั้งไฟล์ [`supabase/schema.sql`](supabase/schema.sql) → **Run**
2. **Authentication → Users → Add user** (อีเมล + รหัสผ่าน, ติ๊ก Auto Confirm)
3. รันใน SQL Editor (เปลี่ยนอีเมล):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'อีเมลของคุณ'
   on conflict do nothing;
   ```
4. แนะนำ: **Authentication → Sign In / Providers → ปิด "Allow new users to sign up"**

## `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

ทั้งสองค่าเปิดเผยได้ (อยู่ในเว็บอยู่แล้ว) — ความปลอดภัยทั้งหมดคุมด้วย Row Level Security ใน Supabase
**ห้ามใส่ secret / service_role key ในโปรเจกต์นี้เด็ดขาด** เพราะทุกอย่างถูกส่งไปที่เบราว์เซอร์

## พัฒนา / อัปเดตเว็บ

```bash
npm install
npm run dev                                   # ทดสอบในเครื่อง → http://localhost:3000
npm run build                                 # สร้างเว็บนิ่งลงโฟลเดอร์ out/
firebase deploy --only hosting                # อัปขึ้น Firebase
```

แก้สินค้า/ราคาในหน้า `/admin` ได้เลย ไม่ต้อง deploy ใหม่ — deploy เฉพาะตอนแก้โค้ด

## ลิงก์ส่งให้ลูกค้า

- ทั้งร้าน: https://flower-store-71379.web.app
- เฉพาะแบบเดียว: กดเปิดสินค้าในหน้าร้าน แล้วคัดลอกลิงก์จากแถบที่อยู่ (ลงท้ายด้วย `#p-...`)
