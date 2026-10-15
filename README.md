# ເວັບແຄັດຕາລັອກຮ້ານດອກໄມ້ / เว็บแคตตาล็อกร้านดอกไม้

- หน้าร้าน `/` — ลูกค้าดูแบบสินค้าแยกตามหมวด กดดูรายละเอียด แล้วทักร้าน (LINE / WhatsApp / Facebook / โทร)
- หลังบ้าน `/admin` — เพิ่ม/แก้ไข/ซ่อน/ลบสินค้า, จัดการหมวดหมู่, แก้ข้อมูลร้าน
- ภาษา: **ลาว (ค่าเริ่มต้น)** และไทย — สลับได้ที่ปุ่ม ລາວ / ไทย
- ข้อมูล รูป และการล็อกอิน ใช้ **Supabase** (Database + Storage + Auth)

## ตั้งค่า Supabase (ครั้งเดียว)

1. **SQL Editor** → วางทั้งไฟล์ [`supabase/schema.sql`](supabase/schema.sql) → **Run**
2. **Authentication → Users → Add user** → ใส่อีเมล + รหัสผ่านของเจ้าของร้าน (ติ๊ก Auto Confirm)
3. กลับไป **SQL Editor** แล้วรัน (เปลี่ยนอีเมล):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'อีเมลของคุณ'
   on conflict do nothing;
   ```
4. แนะนำ: **Authentication → Sign In / Providers → ปิด "Allow new users to sign up"**
   (ถึงไม่ปิด คนที่สมัครเองก็แก้ข้อมูลไม่ได้ แต่ปิดไว้ปลอดภัยกว่า)

## ไฟล์ `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

ใช้แค่ 2 ค่านี้ สิทธิ์ทั้งหมดคุมด้วย Row Level Security ใน Supabase
(ใครก็อ่านสินค้าที่เปิดแสดงได้ แต่แก้ไขได้เฉพาะบัญชีที่อยู่ในตาราง `admins`)

## รัน

```bash
npm install
npm run dev                  # ระหว่างพัฒนา → http://localhost:3000
npm run build && npm start   # ใช้งานจริง (ฝากบน Vercel ได้)
```

## ลิงก์ส่งให้ลูกค้า

- ทั้งร้าน: `https://โดเมนของคุณ/`
- เฉพาะแบบเดียว: กดเปิดสินค้าในหน้าร้าน แล้วคัดลอกลิงก์จากแถบที่อยู่ (ลงท้ายด้วย `#p-...`)
