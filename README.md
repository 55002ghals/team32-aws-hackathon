# 3년동안코딩문법공부했더니ai가다짜주는세상이온건에대하여 : AWS Cloud Pilot

## 어플리케이션 개요

AWS Console에서의 활동을 실시간으로 모니터링하고 Amazon Q를 활용하여 자동 분석한 후, 보안 위험도 및 인프라 구축을 위한 권고사항 제안을 하는 클라우드 구축 어시스턴트입니다. 사용자의 AWS 콘솔 HTTP 요청을 감사하여 중요 작업에 대해서 상세한 보안 분석과 권고사항을 제공합니다.

## 주요 기능

### 🔍 실시간 AWS 콘솔 모니터링
- 브라우저 확장프로그램(Chrome Extension)을 통한 HTTP 요청 실시간 캡처
- Amazon Q 기반 READ/WRITE 작업 자동 분류 (1단계 분류를 통한 요청 필터링)
- AWS 서비스별 맞춤형 분석 후 인프라 및 사용자 상황에 따른 진단을 제공

### 🛡️ 지능형 보안 분석
- Amazon Q 기반 보안 위험도 평가(1단계 분류를 통과한 요청에 한함)
- IAM 권한 및 역할 분석
- 잠재적 인프라 보안 취약점 탐지
- 운영 시 주의사항 및 권고사항 제공

### ⚙️ 보안 모드 선택
- **Security-on-mode**: 강화된 보안 분석 모드, 보안을 1순위로 고려하여 피드백 제공
- **Security-off-mode**: 일반 분석 모드, 보안보다는 사용자의 상황을 고려한 빠른 인프라 구축과 가용성을 위주로 피드백 제공

### 📋 사용자 컨텍스트 관리
- 사용자가 구성하고자 하는 인프라 정보를 입력받아 영속화 후, 매 AmazonQ의 진단마다 이를 고려하여 피드백을 제공.

### 🚀 직접 쿼리 인터페이스
- Amazon Q 직접 질의 기능 (`/prompt`)
- 자동화된 피드백 뿐 아니라, MCP Server를 연동하여 깊이있는 Amazon Q 질의가 가능

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
- `GET /`: AmazonQ Test용 웹 인터페이스
- `POST /errors`: 에러 로그 수집

## 동영상 데모(수정 예정)

[데모 영상 링크 추가 예정]

## 리소스 배포하기(Client Side)

### Window/Mac 버전을 구분하여 다운로드 후 Chrome Exension Load
- Local Directiory에 다운로드
- Chrome '확장 프로그램 관리'로 들어가서 개발자 모드 활성화
- '압축 해제된 확장 프로그램 로드' 클릭 후 설치한 파일의 MAC || Windows 파일을 지정
- 로드 완료 익스텐션 활성화

### 이후 Serverside 배포 후 EC2 IP 및 Port(5000) 입력하여 AWS Console 진입할 것

## 리소스 배포하기(Server Side)

### 1. Main.tf를 Pull/Clone
```bash
# 저장소 클론
git clone https://github.com/55002ghals/team32-aws-hackathon.git
# 메인 디렉토리는 ~/team32-aws-hackathon
```

### 2. Terraform Apply하여 리소스 배포(이때, AWS Credential은 자신의 것으로 AWS CLI에 부여된 상태여야함)
```bash

# AWS Credential 확인
aws configure

# main.tf가 있는 dir로 가서 terraform apply
terraform apply
```

### 3. 리소스 배포가 완료되면 cloudtrail 추적 활성화(Optional)
- AWS Console로 들어가 작업을 진행할 Console에서의 CloudTrail Trail을 활성화
- 실행하지 않아도 AmazonQ Based Feedback은 받을 수 있으나, CloudTrail Feedback은 받을 수 없음 

### 4. application 실행
```shell
bash run.sh
```

## 프로젝트 기대 효과 및 예상 사용 사례 (수정 예정)

### 🎯 기대 효과
- **보안 사고 예방**: 실시간 행위 기반 빠른 위험 탐지로 보안 사고 사전 차단
- **학습 효과**: AWS 모범 사례 혹은 자동 학습 및 클라우드 거부감 저하
- **운영 효율성**: 수동 보안 검토 시간 단축
- **컴플라이언스**: AmazonQ를 바탕으로 자동화된 보안 정책 준수 검증을 빠르게 가능

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
