# 3년동안코딩문법공부했더니ai가다짜주는세상이온건에대하여 : 초등학생도 이해하는 AWS

## 어플리케이션 개요

AWS 콘솔 활동을 실시간으로 모니터링하고 Amazon Q를 활용하여 보안 위험도를 자동 분석하는 지능형 보안 어시스턴트입니다. 사용자의 AWS 콘솔 HTTP 요청을 캡처하여 READ/WRITE 작업을 구분하고, WRITE 작업에 대해서는 상세한 보안 분석과 권고사항을 제공합니다.

## 주요 기능

### 🔍 실시간 AWS 콘솔 모니터링
- 브라우저 확장프로그램을 통한 HTTP 요청 실시간 캡처
- READ/WRITE 작업 자동 분류 (Level1 분석)
- AWS 서비스별 맞춤형 분석

### 🛡️ 지능형 보안 분석 (Level2)
- Amazon Q 기반 보안 위험도 평가
- IAM 권한 및 역할 분석
- 잠재적 보안 취약점 탐지
- 운영 시 주의사항 및 권고사항 제공

### ⚙️ 보안 모드 선택
- **Security-on-dev**: 강화된 보안 분석 모드
- **Security-off-dev**: 일반 분석 모드
- GET 파라미터 `securityMode=true/false`로 제어

### 📋 사용자 컨텍스트 관리
- 사용자 상황 정보 저장 (`/profile`)
- 저장된 정보 조회 (`/profile-check`)
- 파일 기반 영구 저장 (`user-situation`)

### 🚀 직접 쿼리 인터페이스
- Amazon Q 직접 질의 기능 (`/prompt`)
- 실시간 응답 및 ANSI 코드 자동 제거

## API 엔드포인트

### 메인 분석 API
- `POST/GET /api/ask?securityMode=true/false`
  - AWS 콘솔 HTTP 요청 분석
  - READ: 204 No Content 응답
  - WRITE: 상세 보안 분석 결과 반환

### 사용자 프로필 관리
- `POST /profile`: 사용자 상황 정보 저장
- `GET /profile-check`: 저장된 사용자 정보 조회

### 직접 쿼리
- `POST /prompt`: Amazon Q 직접 질의

### 기타
- `GET /`: 웹 인터페이스
- `POST /errors`: 에러 로그 수집

## 동영상 데모

[데모 영상 링크 추가 예정]

## 리소스 배포하기

### 1. 환경 설정
```bash
# 저장소 클론
git clone [repository-url]
cd amazonq-hackathon

# 의존성 설치
pip install -r requirements.txt

# Amazon Q CLI 설정 (사전 필요)
q configure
```

### 2. 애플리케이션 실행
```bash
# 실행 권한 부여
chmod +x run.sh

# 서버 시작
./run.sh
```

### 3. 브라우저 확장프로그램 설치
1. Chrome/Edge 확장프로그램 개발자 모드 활성화
2. 확장프로그램 로드
3. AWS 콘솔 접속하여 모니터링 시작

### 4. 설정 확인
- 서버: `http://localhost:5000`
- 사용자 프로필: `POST /profile`로 컨텍스트 설정
- 보안 모드: URL 파라미터로 제어

## 프로젝트 기대 효과 및 예상 사용 사례

### 🎯 기대 효과
- **보안 사고 예방**: 실시간 위험 탐지로 보안 사고 사전 차단
- **학습 효과**: AWS 보안 모범 사례 자동 학습
- **운영 효율성**: 수동 보안 검토 시간 90% 단축
- **컴플라이언스**: 자동화된 보안 정책 준수 검증

### 💼 예상 사용 사례

#### 개발팀
- 개발 환경에서 실수로 프로덕션 리소스 수정 방지
- IAM 권한 과다 부여 탐지 및 최소 권한 원칙 적용
- 보안 그룹 설정 오류 사전 감지

#### 보안팀
- 실시간 보안 위험 모니터링 대시보드
- 자동화된 보안 정책 위반 탐지
- 보안 교육 자료 자동 생성

#### 운영팀
- 인프라 변경 사항 영향도 분석
- 비용 최적화 기회 식별
- 장애 예방을 위한 사전 경고

#### 신입 개발자
- AWS 서비스 사용법 실시간 가이드
- 보안 모범 사례 학습
- 실수 방지를 위한 안전장치

### 🌟 혁신 포인트
- **Zero-Configuration**: 별도 설정 없이 즉시 사용 가능
- **Context-Aware**: 사용자 상황을 고려한 맞춤형 분석
- **Real-time**: 실시간 분석으로 즉각적인 피드백
- **AI-Powered**: Amazon Q의 강력한 AI 분석 능력 활용
