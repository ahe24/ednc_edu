# ED&C 교육 수강 정보 시스템

수료증 발급을 위한 학생 정보 수집 시스템입니다.

## 🚀 기능

### 강사 기능
- ✅ 강사 계정 생성 및 로그인
- ✅ 과정 생성, 수정, 삭제
- ✅ 학생 정보 조회 및 Excel 내보내기
- ✅ 대시보드에서 과정 관리

### 학생 기능  
- ✅ 로그인 없이 과정별 정보 입력
- ✅ 개인정보 수정 및 삭제 가능
- ✅ 생년월일 날짜 선택기 지원

### 디자인
- ✅ Modern Material-UI 디자인
- ✅ 보라색/황금색 테마 (파란색 제외)
- ✅ 한국어 인터페이스
- ✅ 반응형 웹 디자인

## 🛠 기술 스택

### Backend
- Node.js + Express + TypeScript
- SQLite 데이터베이스
- JWT 인증
- Excel 내보내기 (xlsx)

### Frontend  
- React + TypeScript
- Material-UI v5
- React Hook Form + Yup 검증
- Axios HTTP 클라이언트
- React Router

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
# Backend 의존성 설치
cd backend
npm install

# Frontend 의존성 설치  
cd ../frontend
npm install
```

### 2. 서버 실행

```bash
# Backend 서버 실행 (포트 5000)
cd backend
npm run dev

# Frontend 서버 실행 (포트 3000)
cd ../frontend  
npm start
```

### 3. 애플리케이션 접속

- **학생용**: http://localhost:3000 - 과정 선택 및 정보 입력
- **강사용**: http://localhost:3000/login - 강사 로그인 후 과정 관리

## 📋 사용 방법

### 강사 사용법
1. `/register`에서 강사 계정 생성
2. `/login`에서 로그인
3. 대시보드에서 과정 생성
4. 학생들이 입력한 정보 확인 및 Excel 다운로드

### 학생 사용법
1. 홈페이지에서 수강한 과정 선택
2. 개인정보 입력 (이름, 영문명, 이메일, 소속, 전화번호, 생년월일)
3. 정보 등록 완료

## 🔧 환경 설정

### Backend 환경변수 (.env)
```
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DB_PATH=./database/ednc_edu.db
```

### Frontend 환경변수 (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📁 프로젝트 구조

```
ednc_edu/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API 컨트롤러
│   │   ├── middleware/      # 인증 미들웨어
│   │   ├── models/          # 데이터베이스 모델
│   │   ├── routes/          # API 라우트
│   │   └── server.ts        # 서버 진입점
│   └── database/            # SQLite 데이터베이스
├── frontend/
│   ├── src/
│   │   ├── components/      # 재사용 컴포넌트
│   │   ├── contexts/        # React Context
│   │   ├── pages/           # 페이지 컴포넌트
│   │   └── theme.ts         # Material-UI 테마
└── docs/                    # 문서
```

## 🔐 보안 기능

- JWT 토큰 기반 인증
- 비밀번호 해싱 (bcrypt)
- CORS 보호
- Rate Limiting
- SQL Injection 방지

## 📊 데이터베이스 스키마

### instructors 테이블
- id, name, email, password, created_at

### courses 테이블  
- id, name, schedule, instructor_id, created_at

### students 테이블
- id, name, english_name, email, affiliation, phone, birth_date, course_id, created_at, updated_at

## 🚦 API 엔드포인트

### 인증
- `POST /api/auth/register` - 강사 등록
- `POST /api/auth/login` - 강사 로그인

### 과정 관리
- `GET /api/courses` - 강사 과정 목록 (인증 필요)
- `POST /api/courses` - 과정 생성 (인증 필요)
- `PUT /api/courses/:id` - 과정 수정 (인증 필요)
- `DELETE /api/courses/:id` - 과정 삭제 (인증 필요)
- `GET /api/courses/public` - 공개 과정 목록

### 학생 관리
- `POST /api/students` - 학생 정보 등록
- `GET /api/students/course/:courseId` - 과정별 학생 목록 (인증 필요)
- `PUT /api/students/:id` - 학생 정보 수정
- `DELETE /api/students/:id` - 학생 정보 삭제

## 📄 라이센스

이 프로젝트는 ED&C 교육용으로 제작되었습니다. 