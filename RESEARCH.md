# Electronic Flight Strip (EFS) System - 종합 연구 자료

## 목차
1. [개요](#1-개요)
2. [시스템 구성요소](#2-시스템-구성요소)
3. [Flight Strip 데이터 필드](#3-flight-strip-데이터-필드)
4. [UI/UX 설계 원칙](#4-uiux-설계-원칙)
5. [Strip Bay 구성](#5-strip-bay-구성)
6. [시스템 통합](#6-시스템-통합)
7. [안전 기능](#7-안전-기능)
8. [주요 벤더 상세 분석](#8-주요-벤더-상세-분석)
9. [기술 아키텍처](#9-기술-아키텍처)
10. [개발 요구사항](#10-개발-요구사항)
11. [Standalone FDPS 모듈 설계](#11-standalone-fdps-모듈-설계)
12. [Standalone A-SMGCS 모듈 설계](#12-standalone-a-smgcs-모듈-설계)
13. [Standalone AMAN/DMAN 모듈 설계](#13-standalone-amandman-모듈-설계)
14. [데이터 포맷 및 프로토콜](#14-데이터-포맷-및-프로토콜)
15. [시뮬레이션 데이터 생성](#15-시뮬레이션-데이터-생성)

---

## 1. 개요

### 1.1 Electronic Flight Strip이란?
Electronic Flight Strip (EFS)은 기존 종이 기반 Flight Progress Strip을 디지털화한 시스템으로, 항공교통관제사(ATCO)가 항공기의 비행 데이터를 실시간으로 관리하고 추적할 수 있게 해주는 시스템이다.

> "Electronic or paper strip containing planned and current flight plan data for a specific flight, made available on an electronic display or flight progress board for use by air traffic controllers in the provision of ATS." - EUROCONTROL

### 1.2 주요 목적
- 항공기 식별 및 추적
- 관제 지시(Clearance) 기록
- 다른 관제사와 정보 공유
- 법적 기록 보관
- Runway Incursion 방지

### 1.3 시장 현황
- FAA: 89개 공항에 EFS 배포 (TFDM 프로그램)
- EUROCONTROL: SESAR 프로그램 통해 유럽 전역 확산
- 주요 15개 세계 최대 공항 포함 (Chicago O'Hare, Dallas/Ft. Worth, LAX 등)

### 1.4 본 프로젝트 특징
**Standalone 시스템**: 외부 FDPS, A-SMGCS, AMAN/DMAN 연동 없이도 독립적으로 동작하는 시스템
- 내장 FDPS 모듈로 비행계획 직접 입력/시뮬레이션
- 내장 A-SMGCS 모듈로 지상 이동 시뮬레이션
- 내장 AMAN/DMAN 모듈로 도착/출발 순서 관리
- 훈련용, 시뮬레이션용, 소규모 공항용으로 적합

---

## 2. 시스템 구성요소

### 2.1 핵심 구성요소
```
┌─────────────────────────────────────────────────────────────┐
│                    EFS System Architecture                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │    FDPS     │   │   A-SMGCS   │   │  AMAN/DMAN  │       │
│  │ Flight Data │   │  Surface    │   │  Arrival/   │       │
│  │ Processing  │◄─►│  Movement   │◄─►│  Departure  │       │
│  │   System    │   │   Control   │   │  Manager    │       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │
│         │                 │                 │               │
│         └────────────┬────┴────────────────┘               │
│                      ▼                                      │
│         ┌─────────────────────────┐                        │
│         │    EFS Core Engine      │                        │
│         │  - Strip Management     │                        │
│         │  - Safety Net Logic     │                        │
│         │  - Role-based Access    │                        │
│         └───────────┬─────────────┘                        │
│                     ▼                                       │
│         ┌─────────────────────────┐                        │
│         │   Controller HMI        │                        │
│         │  - Touchscreen Display  │                        │
│         │  - Strip Bays           │                        │
│         │  - Alert Panel          │                        │
│         └─────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 하드웨어 요구사항
- **대형 터치스크린 디스플레이** (24" ~ 32" 권장)
- **고해상도** (Full HD 이상)
- **멀티터치 지원** (최소 10점 터치)
- **산업용 등급** (24/7 연속 운영)
- **백업 전원 시스템**

### 2.3 소프트웨어 구성
- Flight Data Processing Module
- Strip Display Engine
- Safety Net Integration Layer
- Communication Interface (SWIM, OLDI, AFTN)
- User Management & Access Control
- Logging & Audit Trail

---

## 3. Flight Strip 데이터 필드

### 3.1 FAA En Route Strip Format (Form 7230-19) - 30 Fields

| Block | 필드명 | 설명 |
|-------|--------|------|
| 1 | Verification Symbol | 검증 기호 |
| 2 | Revision Number | 개정 번호 |
| 3 | Aircraft ID | 항공기 식별부호 (Callsign) |
| 4 | Aircraft Type/Count | 항공기 유형/대수 |
| 5 | Equipment Suffix | 장비 접미사 (/G, /Z, /W 등) |
| 6 | Sector | 담당 섹터 |
| 7 | Computer ID | 컴퓨터 ID |
| 8 | Ground Speed | 지상속도 |
| 9-10 | Strip Number | 스트립 번호 |
| 11-14 | Previous Fix/Times | 이전 픽스 및 시간 |
| 15-18 | Estimates | 예상 통과 시간 |
| 19 | Fix Location | 픽스 위치 |
| 20 | Altitude | 고도 |
| 21-25 | Route Info | 경로 정보 |
| 26 | Remarks | 비고 |
| 27 | Beacon Code | Transponder 코드 |
| 28 | Control Data | 관제 데이터 |
| 29-30 | Transfer Info | 이관 정보 |

### 3.2 Terminal Strip Format (Arrival/Departure) - 18 Fields

| Block | 필드명 | 설명 |
|-------|--------|------|
| 1 | Aircraft ID | 콜사인 |
| 2 | Revision | 개정 |
| 3 | Type | 항공기 기종 |
| 4 | Computer ID | 컴퓨터 ID |
| 5 | SSR Code | Squawk 코드 |
| 6 | Coordination Data | 조정 데이터 |
| 7 | Departure Data | 출발 데이터 |
| 8 | ETA/Proposed Time | 예상시간 |
| 9 | Route/Altitude/Remarks | 경로/고도/비고 |
| 10-18 | Facility Specific | 시설별 맞춤 데이터 |

### 3.3 핵심 데이터 요소

#### Aircraft Identification
```
민간: N12345, AAL192, KAL018
군용: A12345 (Air Force), N12345 (Navy)
특수: AF1 (대통령 전용기), VM1 (부통령)
```

#### SSR/Transponder Codes (Squawk)
```
일반: 0001-7777 (4자리 8진수, 4096개 코드)
비상 코드:
  - 7500: 하이재킹
  - 7600: 통신두절
  - 7700: 비상상황
  - 2000: SSR 영역 진입 시
```

#### Wake Turbulence Category
```
ICAO 기준:
  - J (Super): A380 등 특대형
  - H (Heavy): 136,000kg 이상
  - M (Medium): 7,000kg ~ 136,000kg
  - L (Light): 7,000kg 이하

RECAT-EU (6단계):
  - A (Super Heavy) → F (Light)
```

#### Equipment Suffix
```
/G: GNSS 장착
/Z: RNAV 장착
/W: 기본 Transponder
/L: RVSM 승인
```

### 3.4 Controller Annotation Symbols

| 기호 | 의미 |
|------|------|
| ↑ | 상승/출발 |
| ↓ | 하강/도착 |
| H | Holding 지시 |
| X | 삭제 |
| I | ILS 접근 |
| ✓ | Clearance 전달 완료 |
| RA | Resolution Advisory (시간 기록) |

---

## 4. UI/UX 설계 원칙

### 4.1 핵심 설계 철학

> "The goal wasn't to change the way air traffic controllers did their jobs, but instead make the tool work for them."

#### Head-Down Time 최소화
- 관제사는 대부분의 시간을 창밖을 보며 교통상황 파악
- **One-touch access**: 한 번의 터치로 필요한 정보 접근
- **Multi-step interaction 회피**: 복잡한 단계 최소화

#### 기존 종이 스트립과의 유사성
- FAA 표준에 따른 레이아웃 유지
- 동일한 정보 배치로 학습 곡선 최소화
- 색상 코딩으로 구분 강화

### 4.2 터치 제스처 설계

```
┌────────────────────────────────────────────────────────┐
│                   Touch Gestures                        │
├────────────────────────────────────────────────────────┤
│  Tap          : Strip 선택/활성화                       │
│  Tap & Hold   : 컨텍스트 메뉴 표시                      │
│  Double Tap   : Strip 확대/상세 정보                    │
│  Swipe Left   : 다음 Bay로 이동                         │
│  Swipe Right  : 이전 Bay로 이동                         │
│  Swipe Up     : Strip 순서 위로                         │
│  Swipe Down   : Strip 순서 아래로                       │
│  Drag & Drop  : Strip을 다른 Bay로 이동                 │
│  Pinch        : 화면 확대/축소                          │
└────────────────────────────────────────────────────────┘
```

### 4.3 색상 코딩 체계

| 색상 | 용도 |
|------|------|
| Blue | 도착 (Arrival) |
| Green | 출발 (Departure) |
| Yellow | 주의/경고 |
| Red | 긴급/위험 |
| White | 일반/대기 |
| Orange | Overflying/Transit |

### 4.4 Strip 레이아웃 예시

```
┌──────────────────────────────────────────────────────────────┐
│ [DEP] KAL018    │ B77W/H │ RKSI → KLAX │ SSR: 2341 │ FL350  │
├──────────────────────────────────────────────────────────────┤
│ SID: GOSAN1B │ RWY 33L │ ETD: 0945 │ SLOT: 0948 │ GATE: 42 │
├──────────────────────────────────────────────────────────────┤
│ [PUSH] [TAXI] [T/O CLR] [DEPARTED] │ Remarks: VIP PAX      │
└──────────────────────────────────────────────────────────────┘
```

### 4.5 Strip 상태 표시

```
Normal     : 일반 배경
Selected   : 강조 테두리
Urgent     : 깜빡임 + 경고색
Ghost      : 반투명 (다른 Bay에서 참조)
Completed  : 흐림 처리
```

---

## 5. Strip Bay 구성

### 5.1 Tower Environment Bay 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    TWR Controller Working Position          │
├────────────────┬───────────────┬────────────────────────────┤
│   DEPARTURE    │    RUNWAY     │         ARRIVAL            │
│                │               │                            │
│ ┌────────────┐ │ ┌───────────┐ │ ┌──────────────────────┐   │
│ │ Clearance  │ │ │  RWY 33L  │ │ │    Initial Approach  │   │
│ │ Delivered  │ │ │ ─────────→│ │ │                      │   │
│ ├────────────┤ │ │  LINE UP  │ │ ├──────────────────────┤   │
│ │   Push     │ │ │  & WAIT   │ │ │     Final Approach   │   │
│ │  Approved  │ │ │           │ │ │                      │   │
│ ├────────────┤ │ ├───────────┤ │ ├──────────────────────┤   │
│ │   Taxi     │ │ │  RWY 33R  │ │ │      Landed          │   │
│ │            │ │ │ ←─────────│ │ │                      │   │
│ ├────────────┤ │ │           │ │ ├──────────────────────┤   │
│ │  Holding   │ │ │           │ │ │   Taxi to Gate       │   │
│ │   Point    │ │ │           │ │ │                      │   │
│ └────────────┘ │ └───────────┘ │ └──────────────────────┘   │
└────────────────┴───────────────┴────────────────────────────┘
```

### 5.2 역할 기반 Bay 구성

#### Ground Controller (GND)
```
- Startup/Pushback Bay
- Taxi Bay (Inbound/Outbound 분리)
- Holding Point Bay
```

#### Local/Tower Controller (TWR)
```
- Runway Bay (각 활주로별)
- Line Up Bay
- Departure/Arrival Bay
```

#### Approach Controller (APP)
```
- Initial Approach Bay
- Final Approach Bay (각 활주로별)
- Missed Approach Bay
- Holding Bay
```

### 5.3 Ghost Strip 개념

> Ghost Strip은 다른 Bay에서 활성화된 Strip의 복제본으로, 해당 항공기가 다른 관제사의 책임 영역에 영향을 줄 수 있음을 알려주는 역할

```
예시:
- RWY Bay에 있는 이륙 대기 항공기 → GND Bay에 Ghost로 표시
- 활주로 점유 상태를 GND 관제사도 인지 가능
- Runway Incursion 예방에 핵심적 역할
```

### 5.4 Bay 간 Strip 이동 워크플로우

```
출발 항공기 흐름:
Clearance Delivered → Push Approved → Taxi → Holding → Lineup → T/O Cleared → Departed

도착 항공기 흐름:
Initial → Final → Landed → Taxi In → At Gate
```

---

## 6. 시스템 통합

### 6.1 통합 대상 시스템

#### FDPS (Flight Data Processing System)
```
- 비행계획 데이터 수신
- 자동 Strip 생성
- 실시간 데이터 업데이트
- OLDI/AFTN 메시지 처리
```

#### A-SMGCS (Advanced Surface Movement Guidance and Control System)
```
- 지상 이동 감시
- 활주로 상태 연동
- 차량/항공기 위치 추적
- Safety Net 알림 연동
```

#### AMAN/DMAN (Arrival/Departure Manager)
```
- 도착 순서 최적화
- 출발 시퀀스 관리
- 슬롯 시간 표시
- CTOT (Calculated Take-Off Time) 연동
```

#### CDM (Collaborative Decision Making)
```
- 항공사 정보 공유
- TOBT (Target Off-Block Time)
- 게이트 할당 정보
- 지연 정보 교환
```

### 6.2 데이터 교환 표준

#### SWIM (System Wide Information Management)
```
프로토콜: JMS (Java Message Service)
포맷: XML
표준:
  - FIXM (Flight Information Exchange Model)
  - AIXM (Aeronautical Information Exchange Model)
  - WXXM (Weather Information Exchange Model)
```

#### OLDI (On-Line Data Interchange)
```
유럽 ATC 시스템 간 표준 통신 프로토콜
메시지 유형:
  - ABI (Advance Boundary Information)
  - ACT (Activation)
  - MAC (Message to Abort Coordination)
```

#### AFTN (Aeronautical Fixed Telecommunication Network)
```
전통적 항공 메시지 네트워크
비행계획, NOTAM 등 교환
```

### 6.3 통합 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                          │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│   FDPS   │ A-SMGCS  │   AMAN   │   DMAN   │      CDM       │
│          │          │          │          │                │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴───────┬────────┘
     │          │          │          │             │
     └──────────┴──────────┴──────────┴─────────────┘
                          │
                          ▼
     ┌─────────────────────────────────────────────┐
     │           Integration Layer                  │
     │  ┌─────────────────────────────────────┐   │
     │  │    Message Broker / ESB              │   │
     │  │    (SWIM Interface)                  │   │
     │  └─────────────────────────────────────┘   │
     │  ┌─────────────────────────────────────┐   │
     │  │    Data Transformation Engine        │   │
     │  │    (FIXM, AIXM Parser)              │   │
     │  └─────────────────────────────────────┘   │
     └─────────────────────────────────────────────┘
                          │
                          ▼
     ┌─────────────────────────────────────────────┐
     │              EFS Core                        │
     │  ┌────────────┐  ┌────────────────────────┐│
     │  │ Strip DB   │  │ Rules Engine           ││
     │  └────────────┘  └────────────────────────┘│
     │  ┌────────────┐  ┌────────────────────────┐│
     │  │ User Mgmt  │  │ Audit/Logging          ││
     │  └────────────┘  └────────────────────────┘│
     └─────────────────────────────────────────────┘
```

---

## 7. 안전 기능

### 7.1 Safety Net 통합

#### RIMCAS (Runway Incursion Monitoring and Conflict Alerting System)
```
기능:
- 활주로 진입 감시
- 충돌 위험 사전 경고
- 시각/청각 알람
- Strip에 경고 상태 표시

트리거 조건:
- 허가 없는 활주로 진입
- 이륙/착륙 중 활주로 점유
- 교차 활주로 충돌 예측
```

#### CMAC (Conformance Monitoring Alerts for Controllers)
```
기능:
- 관제 지시 준수 여부 모니터링
- 경로 이탈 감지
- 고도 이탈 감지
- 속도 이탈 감지
```

#### CATC (Conflicting ATC Clearances)
```
기능:
- 상충되는 관제 지시 탐지
- 동일 고도 할당 경고
- 교차 경로 충돌 예측
```

### 7.2 EFS Safety 기능

```
1. Visual Alerts
   - Strip 색상 변경 (Red/Yellow)
   - 깜빡임 효과
   - 아이콘 표시

2. Audible Alerts
   - 경고음
   - 음성 알림 (TTS)

3. Blocking Actions
   - 위험 동작 차단
   - 확인 요청

4. Ghost Strips
   - 다른 Bay의 관련 항공기 표시
   - 상황 인식 향상
```

### 7.3 안전 관련 Strip 상태

| 상태 | 표시 | 의미 |
|------|------|------|
| CONFLICT | Red 깜빡임 | 충돌 위험 |
| RUNWAY_OCCUPIED | Yellow | 활주로 점유 중 |
| MSAW | Red | 최저안전고도 경고 |
| RA | Orange | TCAS Resolution Advisory |
| DEVIATION | Yellow | 경로/고도 이탈 |

---

## 8. 주요 벤더 상세 분석

### 8.1 Saab Electronic Flight Strips

#### 개요
- **운영 경험**: 15년 이상
- **설치 사이트**: 100+ 전세계
- **플랫폼**: I-ATS (Integrated ATC Suite)
- **확장성**: 모듈형 설계

#### 기술 아키텍처
```
┌─────────────────────────────────────────────────────────┐
│                    Saab I-ATS Platform                   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │              ComCore Communication               │   │
│  │         (Proprietary Data Transfer)             │   │
│  │      - Server-Client Communication              │   │
│  │      - Full Redundancy Support                  │   │
│  │      - COTS Components                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │    EFS      │ │  A-SMGCS    │ │   DMAN      │       │
│  │   Module    │ │   Module    │ │   Module    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Role-Based HMI Configuration           │   │
│  │    - Dynamic role combining/splitting            │   │
│  │    - Workload-based adaptation                  │   │
│  │    - Event-driven commands                      │   │
│  │    - Boolean logic customization                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### 주요 기능
- **Role-Based Dynamic Handling**: 역할 기반 동적 처리, 실시간 역할 분리/통합
- **Safety Net Integration**: A-SMGCS 알림, Runway Incursion 방지
- **Multiple Remote Tower**: 단일 관제사가 다중 공항 관제 가능
- **Open Architecture**: CDM, DMAN, Approach Management 통합

#### HMI 특징
- 아날로그 Strip Board와 유사한 디자인
- Drag & Drop, Action Button 지원
- Strip Animation
- 색상 코드별 공항 구분 (Remote Tower용)

#### 통합 표준 준수
- SESAR
- EUROCONTROL
- EUROCAE
- ICAO A-SMGCS

---

### 8.2 Indra NOVA 9000 EFSS

#### 개요
- **플랫폼**: NOVA 9000 ATM Suite
- **운영체제**: Linux (Open System)
- **설치 현황**: Heathrow, Gatwick, CDG, Dubai, Beijing, Toronto 등 100+ 시스템

#### 기술 아키텍처
```
┌─────────────────────────────────────────────────────────┐
│                    NOVA 9000 Architecture                │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │                 Linux OS Platform                │   │
│  │    - Open System Architecture                   │   │
│  │    - High-speed LAN Communication               │   │
│  │    - COTS Hardware/Software                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   EFSS      │ │    FDPS     │ │  A-SMGCS    │       │
│  │   Module    │ │   Module    │ │   Module    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Controller Working Position (CWP)        │   │
│  │    - Configurable strip layouts                 │   │
│  │    - Pre-defined format options                 │   │
│  │    - Size, shape, fonts, colors                 │   │
│  │    - Strip-less mode support                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### 주요 기능
- **High Reliability**: Very high MTBF and availability
- **Configurable Layouts**: Layout, size, shape, fonts, colors, interaction capability
- **Strip Bay Organization**: 비행 단계별 논리적 그룹핑
- **FDPS Integration**: 통합 Flight Data Processing System
- **Strip-less Mode**: Label과 List를 통한 운영 지원

#### Safety Net 기능
- RIMCAS (Runway Incursion Monitoring)
- Taxiway/Restricted Area Monitoring
- Route Conformance Monitoring
- RWSL (Runway Status Lights) 연계

---

### 8.3 ENAV/Techno Sky TWR EFPS

#### 개요
- **개발사**: Techno Sky (ENAV Group)
- **개발 언어**: Java
- **운영체제**: Windows OS, Linux OS
- **인증**: CMMI-DEV Level 2 (V.3.0), EUROCAE ED-153, ED-205A

#### 기술 아키텍처
```
┌─────────────────────────────────────────────────────────┐
│               ENAV e-TWR ATM Tower Suite                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              TWR FDPS (Core Server)              │   │
│  │    - Flight data processing for tower            │   │
│  │    - SID/STAR procedures                        │   │
│  │    - 4D trajectory prediction                   │   │
│  │    - Free route DCT handling                    │   │
│  │    - Mode-S compliance                          │   │
│  │    - SSR ORCAM rules                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │   CORLM    │ │   STRIPS   │ │    RPS     │          │
│  │Correlation │ │  Printing  │ │  Recorder  │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Airport Safety Support Service          │   │
│  │    - CATC (Conflicting ATC Clearances)          │   │
│  │    - RMCA (Runway Monitoring & Conflict Alert)  │   │
│  │    - CMAC (Conformance Monitoring Alerts)       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  TWR EFPS HMI                    │   │
│  │    - Touch screen / Stylus pen / Mouse          │   │
│  │    - Configurable strip bays                    │   │
│  │    - Drag & drop / Click actions                │   │
│  │    - Next action button                         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### 성능 사양
| 항목 | 값 |
|------|-----|
| 최대 비행계획 수 | 1,000 |
| 최대 Track 수 | 1,000 |
| Failover 시간 | < 20초 |
| 배포 옵션 | Physical / Virtualized / Hybrid |

#### 통합 기능
- **e-AWOS 연동**: 기상정보, 활주로 상태, LVP 정보
- **Airport Ground Lighting**: 활주로 조명 제어, Stop bar 관리
- **Standard Interfaces**: OLDI, AFTN, AMHS
- **A-CDM Integration**: 협력적 의사결정 지원

#### 안전 기능
- **CATC Alerts**: 상충 관제 지시 경고 팝업
- **CMAC Compliant**: 준수 모니터링
- **Airport Safety Support Service**: 통합 안전망

---

### 8.4 Insero E-STRIP

#### 개요
- **제조사**: Insero Air Traffic Solutions
- **특화**: 모든 규모 공항 대응
- **추가 제품군**: AIMS (FDPS), RADIS (Radar Display), SERIS (Statistics)

#### 기술 아키텍처
```
┌─────────────────────────────────────────────────────────┐
│                    Insero Product Suite                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  Insero AIMS                     │   │
│  │           (Flight Data Processing)               │   │
│  │    - Flight plan management                     │   │
│  │    - Data source for E-STRIP                    │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │                 Insero E-STRIP                   │   │
│  │    - Handwriting recognition                    │   │
│  │    - Custom strip creation                      │   │
│  │    - Color-coded airport marking                │   │
│  │    - Audit trail & reporting                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Multiple Remote Tower Module           │   │
│  │    - Single controller, up to 3 airports        │   │
│  │    - Color-coded airport identification         │   │
│  │    - Immediate overview access                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Integration: FDPS, UTM, Airport Info, A-SMGCS          │
└─────────────────────────────────────────────────────────┘
```

#### 주요 기능
- **Handwriting Recognition**: 손글씨로 시간 변경 가능
- **Custom Electronic Strips**: 일반 비행계획 외 정보 공유용 Strip 생성
- **Color-Coded Markings**: Multiple Remote Tower 시 공항 구분
- **Audit Trail**: 모든 변경사항 기록 및 검색

#### UTM 통합
- Unmanned Traffic Management 통합
- 드론 관제 지원

---

## 9. 기술 아키텍처

### 9.1 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Controller HMI Application               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │  │
│  │  │ Strip View  │ │ Bay Manager │ │ Alert Panel │    │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Strip       │ │ Workflow    │ │ Safety Net          │   │
│  │ Management  │ │ Engine      │ │ Integration         │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ User/Role   │ │ Audit       │ │ Notification        │   │
│  │ Management  │ │ Logging     │ │ Service             │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Integration Layer                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                Message Broker (Kafka/RabbitMQ)          ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ FDPS        │ │ A-SMGCS     │ │ AMAN/DMAN           │   │
│  │ Adapter     │ │ Adapter     │ │ Adapter             │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │        PostgreSQL / TimescaleDB (Primary)               ││
│  │        Redis (Cache/Real-time State)                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 9.2 데이터 모델

#### Core Entities

```typescript
// Flight Strip
interface FlightStrip {
  id: string;
  callsign: string;               // KAL018
  aircraftType: string;           // B77W
  wakeTurbulenceCategory: 'J' | 'H' | 'M' | 'L';
  ssrCode: string;                // 2341
  departure: string;              // RKSI
  destination: string;            // KLAX
  altitude: number;               // FL350
  route: string;
  sid?: string;
  star?: string;
  runway?: string;
  gate?: string;
  status: StripStatus;
  bay: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  annotations: Annotation[];
  clearances: Clearance[];
}

// Strip Status
enum StripStatus {
  FILED = 'FILED',
  ACTIVE = 'ACTIVE',
  CLEARANCE_DELIVERED = 'CLEARANCE_DELIVERED',
  PUSH_APPROVED = 'PUSH_APPROVED',
  TAXIING = 'TAXIING',
  HOLDING = 'HOLDING',
  LINEUP = 'LINEUP',
  TAKEOFF_CLEARED = 'TAKEOFF_CLEARED',
  DEPARTED = 'DEPARTED',
  INITIAL_APPROACH = 'INITIAL_APPROACH',
  FINAL_APPROACH = 'FINAL_APPROACH',
  LANDED = 'LANDED',
  TAXI_IN = 'TAXI_IN',
  AT_GATE = 'AT_GATE',
  COMPLETED = 'COMPLETED'
}

// Bay Configuration
interface Bay {
  id: string;
  name: string;
  type: 'DEPARTURE' | 'ARRIVAL' | 'RUNWAY' | 'GROUND' | 'APPROACH';
  position: number;
  controllerRole: string;
  strips: FlightStrip[];
}

// Clearance Record
interface Clearance {
  id: string;
  stripId: string;
  type: ClearanceType;
  value: string;
  issuedBy: string;
  issuedAt: Date;
  readbackReceived: boolean;
}

// Annotation
interface Annotation {
  id: string;
  stripId: string;
  content: string;
  symbol?: string;
  createdBy: string;
  createdAt: Date;
}
```

### 9.3 기술 스택 권장

#### Frontend
```
- Framework: React / Vue.js
- State Management: Redux / Vuex
- UI Library: Custom (ATC 특화)
- Canvas: HTML5 Canvas / WebGL (성능)
- Touch: Hammer.js (제스처)
- Real-time: WebSocket / Socket.io
```

#### Backend
```
- Runtime: Node.js / Java / Go
- Framework: Express / Spring Boot / Gin
- Message Queue: Apache Kafka / RabbitMQ
- Cache: Redis
- Database: PostgreSQL + TimescaleDB
```

#### Integration
```
- Protocol: AMQP, WebSocket, REST
- Format: XML (FIXM/AIXM), JSON
- Security: mTLS, OAuth 2.0
```

---

## 10. 개발 요구사항

### 10.1 기능 요구사항

#### 필수 기능 (MVP)
```
□ Strip 생성/수정/삭제
□ Bay 간 Strip 이동 (Drag & Drop)
□ 터치 제스처 지원
□ 역할 기반 접근 제어
□ 색상 코딩
□ 기본 알림 시스템
□ 수동 Strip 입력
□ Strip 검색
□ 로그 기록
```

#### 확장 기능
```
□ FDPS 연동 (또는 내장 FDPS)
□ A-SMGCS 연동 (또는 내장 A-SMGCS)
□ AMAN/DMAN 연동 (또는 내장 AMAN/DMAN)
□ Safety Net 알림
□ Ghost Strip
□ 다중 활주로 지원
□ Remote Tower 지원
□ 음성 알림
□ 통계/분석
□ 시뮬레이터 모드
```

### 10.2 비기능 요구사항

#### 성능
```
- 응답 시간: < 100ms (Strip 조작)
- 동시 접속자: 20+ 관제사
- Strip 처리량: 500+ 동시 Strip
- 가용성: 99.99% (연간 53분 미만 다운타임)
```

#### 보안
```
- 역할 기반 접근 제어 (RBAC)
- 모든 동작 감사 로깅
- 암호화 통신 (TLS 1.3)
- 세션 관리
```

#### 운영
```
- 24/7 무중단 운영
- Hot Standby 이중화
- 자동 장애 복구
- 실시간 모니터링
```

### 10.3 인증/표준 준수

```
- DO-178C (소프트웨어 인증)
- ED-153 (EUROCAE)
- EUROCONTROL SPEC
- FAA 8040.4
- ICAO Annex 11
```

---

## 11. Standalone FDPS 모듈 설계

### 11.1 개요

외부 FDPS 없이도 EFS가 독립적으로 동작할 수 있도록 하는 내장 비행 데이터 처리 모듈

### 11.2 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Standalone FDPS Module                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Flight Plan Input Layer                 │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ Manual FPL  │ │ ICAO FPL    │ │  Scenario   │   │   │
│  │  │   Entry     │ │  Parser     │ │  Loader     │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Flight Plan Processing                  │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   Route     │ │  Trajectory │ │   Time      │   │   │
│  │  │  Validator  │ │  Calculator │ │  Estimator  │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Strip Generation Engine                 │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  Departure  │ │   Arrival   │ │   Overflight│   │   │
│  │  │   Strip     │ │   Strip     │ │   Strip     │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Data Management                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  Aircraft   │ │  Airport    │ │  Airspace   │   │   │
│  │  │  Database   │ │  Database   │ │  Database   │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.3 ICAO FPL 파서

#### FPL 메시지 구조
```
(FPL-<Aircraft ID>-<Flight Rules><Type of Flight>
-<Number><Type of Aircraft>/<Wake Turbulence>-<Equipment>
-<Departure Aerodrome><Time>
-<Speed><Level><Route>
-<Destination Aerodrome><Total EET><Alternate>
-<Other Information>)
```

#### 필드 정의

| 필드 | ICAO Field | 설명 | 예시 |
|------|------------|------|------|
| F3 | Message Type | 메시지 유형 | FPL |
| F7 | Aircraft ID | 항공기 식별부호 | KAL018 |
| F8a | Flight Rules | 비행 규칙 | I (IFR), V (VFR), Y, Z |
| F8b | Type of Flight | 비행 유형 | S (Scheduled), N (Non-scheduled), G (General), M (Military) |
| F9a | Number | 항공기 대수 | 1 |
| F9b | Type of Aircraft | 기종 ICAO 코드 | B77W |
| F9c | Wake Turbulence | 후류난기류 등급 | H, M, L, J |
| F10a | Equipment | NAV/COM 장비 | S (Standard), G (GNSS) |
| F10b | Surveillance | 감시 장비 | S (SSR Mode A/C), C (SSR Mode S) |
| F13a | Departure | 출발 공항 | RKSI |
| F13b | Time | EOBT | 0945 |
| F15a | Speed | 순항 속도 | N0450 (450kt), M082 (Mach 0.82) |
| F15b | Level | 순항 고도 | F350 (FL350), A100 (10,000ft) |
| F15c | Route | 비행 경로 | DCT GOSAN B597 NIPPI |
| F16a | Destination | 도착 공항 | KLAX |
| F16b | Total EET | 총 소요시간 | 1030 |
| F16c | Alternate | 대체 공항 | KSFO |
| F18 | Other Info | 기타 정보 | PBN/A1B1C1D1 NAV/... |

#### 파서 구현

```typescript
interface ParsedFlightPlan {
  messageType: 'FPL' | 'CHG' | 'CNL' | 'DEP' | 'ARR';
  callsign: string;
  flightRules: 'I' | 'V' | 'Y' | 'Z';
  flightType: 'S' | 'N' | 'G' | 'M' | 'X';
  aircraftCount: number;
  aircraftType: string;
  wakeTurbulence: 'J' | 'H' | 'M' | 'L';
  equipment: string;
  surveillance: string;
  departureAirport: string;
  eobt: string;  // HHMM
  cruiseSpeed: string;
  cruiseLevel: string;
  route: string;
  destinationAirport: string;
  eet: string;  // HHMM
  alternateAirports: string[];
  otherInfo: Map<string, string>;
}

class ICAOFlightPlanParser {
  parse(fplMessage: string): ParsedFlightPlan {
    // FPL 메시지 파싱 로직
  }

  validate(fpl: ParsedFlightPlan): ValidationResult {
    // 비행계획 유효성 검증
  }

  generateStrip(fpl: ParsedFlightPlan): FlightStrip {
    // Strip 데이터 생성
  }
}
```

### 11.4 4D 궤적 예측 엔진

#### 입력 데이터
```typescript
interface TrajectoryInput {
  flightPlan: ParsedFlightPlan;
  aircraftPerformance: AircraftPerformance;  // BADA 데이터
  weatherData: WeatherData;                   // 바람, 기온
  airspaceConstraints: AirspaceConstraint[];
}
```

#### 궤적 계산 알고리즘

```typescript
interface Trajectory4D {
  waypoints: TrajectoryPoint[];
}

interface TrajectoryPoint {
  latitude: number;
  longitude: number;
  altitude: number;         // feet
  time: Date;
  groundSpeed: number;      // knots
  trueAirspeed: number;     // knots
  heading: number;          // degrees
  verticalRate: number;     // fpm
}

class TrajectoryPredictor {
  // 기본 궤적 계산 (무풍 상태)
  calculateBasicTrajectory(input: TrajectoryInput): Trajectory4D {
    const waypoints: TrajectoryPoint[] = [];

    // 1. 경로 포인트 추출
    const routePoints = this.parseRoute(input.flightPlan.route);

    // 2. 각 구간별 비행 시간 계산
    for (let i = 0; i < routePoints.length - 1; i++) {
      const segment = this.calculateSegment(
        routePoints[i],
        routePoints[i + 1],
        input.aircraftPerformance,
        input.flightPlan.cruiseLevel
      );
      waypoints.push(...segment);
    }

    return { waypoints };
  }

  // 바람 보정 적용
  applyWindCorrection(
    trajectory: Trajectory4D,
    windData: WindData[]
  ): Trajectory4D {
    // 고도별 바람 데이터 적용
    // 지상속도 = 대기속도 + 바람벡터
  }

  // 예상 도착 시간 계산
  calculateETA(trajectory: Trajectory4D): Date {
    return trajectory.waypoints[trajectory.waypoints.length - 1].time;
  }
}
```

### 11.5 항공기 성능 데이터베이스 (BADA 스타일)

```typescript
interface AircraftPerformance {
  icaoType: string;           // B77W
  manufacturer: string;       // Boeing
  model: string;              // 777-300ER
  wakeTurbulence: string;     // H

  // 성능 파라미터
  mass: {
    min: number;              // 최소 중량 (kg)
    max: number;              // 최대 이륙중량 (kg)
    reference: number;        // 기준 중량 (kg)
  };

  speeds: {
    v2: number;               // 이륙 안전속도
    vClimb: number;           // 상승 속도
    vCruise: number;          // 순항 속도
    vDescent: number;         // 강하 속도
    vApproach: number;        // 접근 속도
    vLanding: number;         // 착륙 속도
    mmo: number;              // 최대 운용 마하수
  };

  altitudes: {
    maxOperational: number;   // 최대 운용 고도 (ft)
    optimalCruise: number;    // 최적 순항 고도 (ft)
  };

  climb: {
    rateInitial: number;      // 초기 상승률 (fpm)
    rateCruise: number;       // 순항 고도 상승률 (fpm)
  };

  descent: {
    rate: number;             // 강하율 (fpm)
    angle: number;            // 강하각 (degrees)
  };
}

// 샘플 항공기 데이터
const aircraftDatabase: Map<string, AircraftPerformance> = new Map([
  ['B77W', {
    icaoType: 'B77W',
    manufacturer: 'Boeing',
    model: '777-300ER',
    wakeTurbulence: 'H',
    mass: { min: 167800, max: 351500, reference: 299400 },
    speeds: {
      v2: 160, vClimb: 290, vCruise: 490, vDescent: 290,
      vApproach: 145, vLanding: 135, mmo: 0.89
    },
    altitudes: { maxOperational: 43100, optimalCruise: 35000 },
    climb: { rateInitial: 2500, rateCruise: 1000 },
    descent: { rate: 2000, angle: 3 }
  }],
  ['A388', {
    icaoType: 'A388',
    manufacturer: 'Airbus',
    model: 'A380-800',
    wakeTurbulence: 'J',
    mass: { min: 277000, max: 575000, reference: 510000 },
    speeds: {
      v2: 155, vClimb: 300, vCruise: 490, vDescent: 290,
      vApproach: 145, vLanding: 130, mmo: 0.89
    },
    altitudes: { maxOperational: 43000, optimalCruise: 35000 },
    climb: { rateInitial: 2000, rateCruise: 800 },
    descent: { rate: 1800, angle: 3 }
  }],
  // ... 추가 항공기
]);
```

### 11.6 공항 데이터베이스

```typescript
interface Airport {
  icao: string;           // RKSI
  iata: string;           // ICN
  name: string;           // Incheon International Airport
  location: {
    latitude: number;     // 37.4691
    longitude: number;    // 126.4505
  };
  elevation: number;      // feet
  timezone: string;       // Asia/Seoul

  runways: Runway[];
  taxiways: Taxiway[];
  gates: Gate[];
  sids: Procedure[];
  stars: Procedure[];
  holdingPatterns: HoldingPattern[];
}

interface Runway {
  id: string;             // 33L
  heading: number;        // 330
  length: number;         // meters
  width: number;          // meters
  threshold: {
    latitude: number;
    longitude: number;
  };
  ils: {
    frequency: number;
    course: number;
    glideslope: number;
  } | null;
}

interface Procedure {
  id: string;             // GOSAN1B
  type: 'SID' | 'STAR';
  runway: string;         // 33L
  waypoints: ProcedureWaypoint[];
}

interface ProcedureWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  altitude?: {
    constraint: 'AT' | 'ABOVE' | 'BELOW' | 'BETWEEN';
    value: number;
    upperValue?: number;
  };
  speed?: {
    constraint: 'AT' | 'MAX' | 'MIN';
    value: number;
  };
}
```

### 11.7 시나리오 로더

```typescript
interface TrafficScenario {
  id: string;
  name: string;
  airport: string;
  duration: number;       // minutes
  flights: ScenarioFlight[];
}

interface ScenarioFlight {
  callsign: string;
  type: 'DEPARTURE' | 'ARRIVAL';
  aircraftType: string;
  scheduledTime: string;  // HH:MM (시나리오 시작 기준)
  origin?: string;        // 도착편
  destination?: string;   // 출발편
  runway: string;
  gate: string;
  route?: string;
  remarks?: string;
}

// 샘플 시나리오
const sampleScenario: TrafficScenario = {
  id: 'RKSI-MORNING-RUSH',
  name: 'Incheon Morning Rush Hour',
  airport: 'RKSI',
  duration: 120,
  flights: [
    {
      callsign: 'KAL001',
      type: 'DEPARTURE',
      aircraftType: 'B77W',
      scheduledTime: '00:00',
      destination: 'KLAX',
      runway: '33L',
      gate: '42',
      route: 'GOSAN1B GOSAN B597 NIPPI'
    },
    {
      callsign: 'AAR101',
      type: 'ARRIVAL',
      aircraftType: 'A333',
      scheduledTime: '00:05',
      origin: 'RJTT',
      runway: '33R',
      gate: '25'
    },
    // ... 추가 비행편
  ]
};
```

---

## 12. Standalone A-SMGCS 모듈 설계

### 12.1 개요

외부 A-SMGCS 없이 지상 이동 상황을 시뮬레이션하고 Safety Net 기능을 제공하는 모듈

### 12.2 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                 Standalone A-SMGCS Module                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Surveillance Simulation Layer             │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  Aircraft   │ │   Vehicle   │ │   Track     │   │   │
│  │  │  Simulator  │ │  Simulator  │ │   Fusion    │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Safety Net Engine                    │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   RIMCAS    │ │    CMAC     │ │    CATC     │   │   │
│  │  │  (Runway)   │ │(Conformance)│ │ (Conflict)  │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Ground Display Module                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   Airport   │ │   Traffic   │ │   Alert     │   │   │
│  │  │     Map     │ │   Overlay   │ │  Display    │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 12.3 ADS-B 데이터 시뮬레이션

#### ADS-B 메시지 구조 (Mode S Extended Squitter)

```typescript
interface ADSBMessage {
  // DF17 (Downlink Format 17)
  downlinkFormat: 17;
  capability: number;        // 0-7
  icaoAddress: string;       // 24-bit hex (예: 71BF01)
  typeCode: number;          // 1-31

  // 위치 정보 (TC 9-18)
  position?: {
    latitude: number;
    longitude: number;
    altitude: number;        // feet
    altitudeType: 'BARO' | 'GNSS';
    cprFormat: 'ODD' | 'EVEN';
  };

  // 속도 정보 (TC 19)
  velocity?: {
    groundSpeed: number;     // knots
    track: number;           // degrees
    verticalRate: number;    // fpm
    groundSpeedType: 'GROUND' | 'AIRSPEED';
  };

  // 식별 정보 (TC 1-4)
  identification?: {
    callsign: string;
    category: string;        // A0-D7
  };

  // 항공기 상태 (TC 28, 29)
  status?: {
    emergencyState: 'NONE' | 'GENERAL' | 'LIFEGUARD' | 'MINIMUM_FUEL' |
                    'NO_COMM' | 'UNLAWFUL' | 'DOWNED';
    squawk: string;
  };

  timestamp: Date;
}
```

#### ASTERIX CAT 021 (ADS-B) 시뮬레이션

```typescript
interface ASTERIXCat021 {
  // I021/010 - Data Source Identification
  sac: number;               // System Area Code
  sic: number;               // System Identification Code

  // I021/040 - Target Report Descriptor
  targetType: 'SSR' | 'ADSB' | 'MLAT';

  // I021/080 - Target Address
  icaoAddress: string;

  // I021/130 - Position in WGS-84
  latitude: number;
  longitude: number;

  // I021/140 - Geometric Height
  geometricHeight: number;   // feet

  // I021/145 - Flight Level
  flightLevel: number;       // FL

  // I021/160 - Airborne Ground Vector
  groundSpeed: number;       // knots
  trackAngle: number;        // degrees

  // I021/170 - Target Identification
  callsign: string;

  // I021/200 - Target Status
  status: {
    icf: boolean;            // Intent Change Flag
    lnav: boolean;           // LNAV Mode
    ps: number;              // Priority Status
    ss: number;              // Surveillance Status
  };

  // I021/210 - MOPS Version
  mopsVersion: number;

  timestamp: Date;
}
```

### 12.4 지상 이동 시뮬레이터

```typescript
interface SurfaceTarget {
  id: string;
  type: 'AIRCRAFT' | 'VEHICLE' | 'UNKNOWN';
  callsign?: string;
  icaoAddress?: string;

  position: {
    latitude: number;
    longitude: number;
  };

  groundSpeed: number;       // knots
  heading: number;           // degrees

  state: 'PARKED' | 'PUSHBACK' | 'TAXI' | 'HOLDING' |
         'LINEUP' | 'TAKEOFF_ROLL' | 'LANDING_ROLL' | 'STOPPED';

  currentLocation: {
    type: 'GATE' | 'TAXIWAY' | 'RUNWAY' | 'APRON' | 'HOLDING_POINT';
    id: string;
  };

  route?: TaxiRoute;
}

interface TaxiRoute {
  waypoints: TaxiWaypoint[];
  currentIndex: number;
}

interface TaxiWaypoint {
  type: 'GATE' | 'TAXIWAY' | 'INTERSECTION' | 'HOLDING_POINT' | 'RUNWAY';
  id: string;
  position: { latitude: number; longitude: number; };
  expectedSpeed: number;
}

class SurfaceMovementSimulator {
  private targets: Map<string, SurfaceTarget> = new Map();
  private updateInterval: number = 1000;  // ms

  addAircraft(strip: FlightStrip, initialPosition: string): void {
    const target: SurfaceTarget = {
      id: strip.id,
      type: 'AIRCRAFT',
      callsign: strip.callsign,
      icaoAddress: this.generateICAOAddress(),
      position: this.getPositionOf(initialPosition),
      groundSpeed: 0,
      heading: 0,
      state: 'PARKED',
      currentLocation: { type: 'GATE', id: initialPosition }
    };
    this.targets.set(target.id, target);
  }

  assignTaxiRoute(targetId: string, route: TaxiRoute): void {
    const target = this.targets.get(targetId);
    if (target) {
      target.route = route;
      target.state = 'TAXI';
    }
  }

  updatePositions(): void {
    // 매 초마다 위치 업데이트
    for (const target of this.targets.values()) {
      if (target.state === 'TAXI' && target.route) {
        this.advanceAlongRoute(target);
      } else if (target.state === 'TAKEOFF_ROLL') {
        this.advanceTakeoffRoll(target);
      } else if (target.state === 'LANDING_ROLL') {
        this.advanceLandingRoll(target);
      }
    }
  }

  generateADSBUpdates(): ADSBMessage[] {
    // 각 타겟에 대해 ADS-B 메시지 생성
    return Array.from(this.targets.values()).map(target => ({
      downlinkFormat: 17,
      capability: 5,
      icaoAddress: target.icaoAddress!,
      typeCode: 11,  // Surface Position
      position: {
        latitude: target.position.latitude,
        longitude: target.position.longitude,
        altitude: 0,
        altitudeType: 'GNSS',
        cprFormat: 'ODD'
      },
      velocity: {
        groundSpeed: target.groundSpeed,
        track: target.heading,
        verticalRate: 0,
        groundSpeedType: 'GROUND'
      },
      identification: {
        callsign: target.callsign || 'UNKNOWN',
        category: 'A3'
      },
      timestamp: new Date()
    }));
  }
}
```

### 12.5 Safety Net 엔진

#### RIMCAS (Runway Incursion Monitoring and Conflict Alert System)

```typescript
interface RIMCASAlert {
  id: string;
  severity: 'CAUTION' | 'WARNING';
  type: 'INCURSION' | 'CONFLICT';
  runway: string;
  involvedTargets: string[];
  message: string;
  timestamp: Date;
}

class RIMCASEngine {
  private runways: Runway[];
  private protectedAreas: ProtectedArea[];

  constructor(airportData: Airport) {
    this.runways = airportData.runways;
    this.protectedAreas = this.defineProtectedAreas();
  }

  checkForIncursions(targets: SurfaceTarget[], clearances: Clearance[]): RIMCASAlert[] {
    const alerts: RIMCASAlert[] = [];

    for (const runway of this.runways) {
      const targetsOnRunway = this.getTargetsInArea(targets, runway.protectedArea);

      // 활주로에 2개 이상 타겟이 있으면 경고
      if (targetsOnRunway.length > 1) {
        alerts.push({
          id: generateId(),
          severity: 'WARNING',
          type: 'CONFLICT',
          runway: runway.id,
          involvedTargets: targetsOnRunway.map(t => t.callsign!),
          message: `Runway ${runway.id} conflict: ${targetsOnRunway.map(t => t.callsign).join(', ')}`,
          timestamp: new Date()
        });
      }

      // 허가 없이 활주로 진입
      for (const target of targetsOnRunway) {
        if (!this.hasRunwayClearance(target, runway, clearances)) {
          alerts.push({
            id: generateId(),
            severity: 'WARNING',
            type: 'INCURSION',
            runway: runway.id,
            involvedTargets: [target.callsign!],
            message: `Unauthorized entry: ${target.callsign} on runway ${runway.id}`,
            timestamp: new Date()
          });
        }
      }
    }

    return alerts;
  }

  private defineProtectedAreas(): ProtectedArea[] {
    // 각 활주로에 대한 보호 구역 정의
    return this.runways.map(runway => ({
      runwayId: runway.id,
      polygon: this.calculateRunwayPolygon(runway)
    }));
  }
}
```

#### CATC (Conflicting ATC Clearances)

```typescript
interface CATCAlert {
  id: string;
  type: 'ALTITUDE_CONFLICT' | 'ROUTE_CONFLICT' | 'RUNWAY_CONFLICT' | 'HOLDING_CONFLICT';
  severity: 'WARNING';
  involvedFlights: string[];
  message: string;
  timestamp: Date;
}

class CATCEngine {
  checkClearanceConflicts(
    newClearance: Clearance,
    existingClearances: Clearance[],
    strips: FlightStrip[]
  ): CATCAlert[] {
    const alerts: CATCAlert[] = [];

    // 동일 활주로 이륙/착륙 허가 충돌
    if (newClearance.type === 'TAKEOFF' || newClearance.type === 'LANDING') {
      const conflicting = existingClearances.filter(c =>
        (c.type === 'TAKEOFF' || c.type === 'LANDING') &&
        c.value === newClearance.value &&  // 같은 활주로
        c.stripId !== newClearance.stripId
      );

      if (conflicting.length > 0) {
        alerts.push({
          id: generateId(),
          type: 'RUNWAY_CONFLICT',
          severity: 'WARNING',
          involvedFlights: [
            this.getCallsign(newClearance.stripId, strips),
            ...conflicting.map(c => this.getCallsign(c.stripId, strips))
          ],
          message: `Conflicting runway clearance for ${newClearance.value}`,
          timestamp: new Date()
        });
      }
    }

    // 동일 고도 할당 충돌 (근접 항공기)
    if (newClearance.type === 'ALTITUDE') {
      // 충돌 검사 로직
    }

    return alerts;
  }
}
```

---

## 13. Standalone AMAN/DMAN 모듈 설계

### 13.1 개요

도착 및 출발 시퀀스를 자동으로 최적화하고 관리하는 모듈

### 13.2 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│              Standalone AMAN/DMAN Module                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐   ┌──────────────────────┐       │
│  │         AMAN         │   │         DMAN         │       │
│  │   (Arrival Manager)  │   │  (Departure Manager) │       │
│  │                      │   │                      │       │
│  │  ┌────────────────┐  │   │  ┌────────────────┐  │       │
│  │  │  ETA Calculator│  │   │  │ TOBT Receiver  │  │       │
│  │  └────────────────┘  │   │  └────────────────┘  │       │
│  │  ┌────────────────┐  │   │  ┌────────────────┐  │       │
│  │  │ Sequence       │  │   │  │ TSAT Calculator│  │       │
│  │  │ Optimizer      │  │   │  └────────────────┘  │       │
│  │  └────────────────┘  │   │  ┌────────────────┐  │       │
│  │  ┌────────────────┐  │   │  │ Sequence       │  │       │
│  │  │ Delay Advisor  │  │   │  │ Optimizer      │  │       │
│  │  └────────────────┘  │   │  └────────────────┘  │       │
│  └──────────────────────┘   └──────────────────────┘       │
│                     │           │                           │
│                     ▼           ▼                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Runway Capacity Manager                 │   │
│  │  ┌────────────────┐ ┌────────────────────────────┐  │   │
│  │  │ Wake Turbulence│ │  Runway Mode Optimizer     │  │   │
│  │  │ Separation     │ │  (Mixed/Segregated)        │  │   │
│  │  └────────────────┘ └────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 13.3 AMAN (Arrival Manager)

#### 핵심 알고리즘

```typescript
interface ArrivalSequence {
  flights: SequencedArrival[];
  runway: string;
  calculatedAt: Date;
}

interface SequencedArrival {
  callsign: string;
  stripId: string;
  originalETA: Date;
  scheduledTime: Date;      // TLDT (Target Landing Time)
  delay: number;            // seconds
  sequencePosition: number;
  meter fix: string;        // IAF (Initial Approach Fix)
  advisedSpeed?: number;    // Speed advisory
  advisedDelay?: number;    // Holding time if needed
}

class ArrivalManager {
  private separationMatrix: WakeSeparationMatrix;
  private runwayCapacity: number = 30;  // movements/hour

  constructor() {
    this.separationMatrix = this.initializeSeparationMatrix();
  }

  calculateSequence(arrivals: FlightStrip[], runway: string): ArrivalSequence {
    // 1. ETA 기준 정렬
    const sorted = [...arrivals].sort((a, b) =>
      this.getETA(a).getTime() - this.getETA(b).getTime()
    );

    // 2. Wake Turbulence 분리 적용
    const sequenced: SequencedArrival[] = [];
    let lastLandingTime: Date | null = null;
    let lastWakeCategory: string | null = null;

    for (const flight of sorted) {
      const eta = this.getETA(flight);
      const wakeCategory = flight.wakeTurbulenceCategory;

      let scheduledTime = eta;

      if (lastLandingTime && lastWakeCategory) {
        const minSeparation = this.separationMatrix.get(
          lastWakeCategory,
          wakeCategory
        );
        const minTime = new Date(lastLandingTime.getTime() + minSeparation * 1000);

        if (eta < minTime) {
          scheduledTime = minTime;
        }
      }

      const delay = (scheduledTime.getTime() - eta.getTime()) / 1000;

      sequenced.push({
        callsign: flight.callsign,
        stripId: flight.id,
        originalETA: eta,
        scheduledTime,
        delay,
        sequencePosition: sequenced.length + 1,
        meterFix: this.getMeterFix(flight),
        advisedSpeed: delay > 60 ? this.calculateSpeedAdvisory(flight, delay) : undefined,
        advisedDelay: delay > 300 ? Math.ceil(delay / 60) : undefined
      });

      lastLandingTime = scheduledTime;
      lastWakeCategory = wakeCategory;
    }

    return {
      flights: sequenced,
      runway,
      calculatedAt: new Date()
    };
  }

  private initializeSeparationMatrix(): WakeSeparationMatrix {
    // ICAO Wake Turbulence Separation (seconds)
    // Leader → Follower
    return new WakeSeparationMatrix([
      //        J      H      M      L     (Follower)
      /* J */ [120,   180,   240,   240],
      /* H */ [60,    90,    120,   180],
      /* M */ [60,    60,    60,    120],
      /* L */ [60,    60,    60,    60],
      // (Leader)
    ]);
  }
}
```

### 13.4 DMAN (Departure Manager)

#### CDM 타임라인

```
┌─────────────────────────────────────────────────────────────┐
│                    CDM Timeline                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SOBT  EOBT  TOBT  TSAT  AOBT  AXOT  ATOT                 │
│   │     │     │     │     │     │     │                    │
│   │     │     │     │     │     │     └── Actual T/O Time  │
│   │     │     │     │     │     └──────── Actual Taxi Out  │
│   │     │     │     │     └────────────── Actual Off-Block │
│   │     │     │     └──────────────────── Target Start-up  │
│   │     │     └────────────────────────── Target Off-Block │
│   │     └──────────────────────────────── Estimated O-B    │
│   └────────────────────────────────────── Scheduled O-B    │
│                                                             │
│  ◄────────────────── Pre-Departure ──────────────────────► │
│                                                             │
│  Taxi Time = TTOT - TSAT                                   │
│  TTOT = Target Take-Off Time                               │
│  CTOT = Calculated Take-Off Time (ATFM slot)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 핵심 알고리즘

```typescript
interface DepartureSequence {
  flights: SequencedDeparture[];
  runway: string;
  calculatedAt: Date;
}

interface SequencedDeparture {
  callsign: string;
  stripId: string;
  tobt: Date;               // Target Off-Block Time
  tsat: Date;               // Target Start-up Approval Time
  ttot: Date;               // Target Take-Off Time
  ctot?: Date;              // Calculated Take-Off Time (ATFM)
  taxiTime: number;         // seconds
  sequencePosition: number;
  gate: string;
  runway: string;
}

class DepartureManager {
  private taxiTimeMatrix: TaxiTimeMatrix;
  private separationMatrix: WakeSeparationMatrix;

  calculateSequence(departures: FlightStrip[], runway: string): DepartureSequence {
    // 1. TOBT 기준 정렬 (CTOT 있는 경우 우선)
    const sorted = this.sortByPriority(departures);

    // 2. 시퀀스 계산
    const sequenced: SequencedDeparture[] = [];
    let lastTakeoffTime: Date | null = null;
    let lastWakeCategory: string | null = null;

    for (const flight of sorted) {
      const tobt = this.getTOBT(flight);
      const gate = flight.gate || 'UNKNOWN';
      const taxiTime = this.taxiTimeMatrix.get(gate, runway);

      // TTOT 계산 (TOBT + Taxi Time)
      let ttot = new Date(tobt.getTime() + taxiTime * 1000);

      // Wake Turbulence 분리 적용
      if (lastTakeoffTime && lastWakeCategory) {
        const minSeparation = this.separationMatrix.get(
          lastWakeCategory,
          flight.wakeTurbulenceCategory
        );
        const minTime = new Date(lastTakeoffTime.getTime() + minSeparation * 1000);

        if (ttot < minTime) {
          ttot = minTime;
        }
      }

      // CTOT 제약 적용
      const ctot = this.getCTOT(flight);
      if (ctot && ttot > ctot) {
        // CTOT 위반 경고
        console.warn(`${flight.callsign}: TTOT exceeds CTOT`);
      }

      // TSAT = TTOT - Taxi Time
      const tsat = new Date(ttot.getTime() - taxiTime * 1000);

      sequenced.push({
        callsign: flight.callsign,
        stripId: flight.id,
        tobt,
        tsat,
        ttot,
        ctot,
        taxiTime,
        sequencePosition: sequenced.length + 1,
        gate,
        runway
      });

      lastTakeoffTime = ttot;
      lastWakeCategory = flight.wakeTurbulenceCategory;
    }

    return {
      flights: sequenced,
      runway,
      calculatedAt: new Date()
    };
  }

  private sortByPriority(departures: FlightStrip[]): FlightStrip[] {
    return [...departures].sort((a, b) => {
      // CTOT 있는 항공기 우선
      const ctotA = this.getCTOT(a);
      const ctotB = this.getCTOT(b);

      if (ctotA && !ctotB) return -1;
      if (!ctotA && ctotB) return 1;
      if (ctotA && ctotB) {
        return ctotA.getTime() - ctotB.getTime();
      }

      // TOBT 기준 정렬
      return this.getTOBT(a).getTime() - this.getTOBT(b).getTime();
    });
  }
}
```

### 13.5 통합 Runway Capacity Manager

```typescript
interface RunwayConfiguration {
  runway: string;
  mode: 'DEPARTURE' | 'ARRIVAL' | 'MIXED';
  arrivalRate: number;      // movements/hour
  departureRate: number;    // movements/hour
}

class RunwayCapacityManager {
  private configurations: RunwayConfiguration[];
  private aman: ArrivalManager;
  private dman: DepartureManager;

  calculateIntegratedSequence(
    arrivals: FlightStrip[],
    departures: FlightStrip[]
  ): IntegratedSequence {
    const result: IntegratedSequence = {
      movements: [],
      calculatedAt: new Date()
    };

    for (const config of this.configurations) {
      if (config.mode === 'MIXED') {
        // Mixed mode: 도착-출발 interleaving
        const arrSeq = this.aman.calculateSequence(
          arrivals.filter(a => a.runway === config.runway),
          config.runway
        );
        const depSeq = this.dman.calculateSequence(
          departures.filter(d => d.runway === config.runway),
          config.runway
        );

        result.movements.push(
          ...this.interleaveSequences(arrSeq, depSeq, config)
        );
      } else {
        // Segregated mode
        // ...
      }
    }

    return result;
  }

  private interleaveSequences(
    arrivals: ArrivalSequence,
    departures: DepartureSequence,
    config: RunwayConfiguration
  ): SequencedMovement[] {
    // 도착 사이에 출발 삽입
    // 보통 2 arrivals 후 1-2 departures 패턴
    const movements: SequencedMovement[] = [];

    let arrIdx = 0;
    let depIdx = 0;
    let lastMovementTime: Date | null = null;

    while (arrIdx < arrivals.flights.length || depIdx < departures.flights.length) {
      // 도착 우선 (arrivals have priority)
      if (arrIdx < arrivals.flights.length) {
        const arr = arrivals.flights[arrIdx];
        movements.push({
          type: 'ARRIVAL',
          callsign: arr.callsign,
          scheduledTime: arr.scheduledTime,
          runway: config.runway
        });
        lastMovementTime = arr.scheduledTime;
        arrIdx++;

        // 다음 도착까지 갭이 있으면 출발 삽입
        if (arrIdx < arrivals.flights.length) {
          const nextArr = arrivals.flights[arrIdx];
          const gap = nextArr.scheduledTime.getTime() - lastMovementTime.getTime();

          if (gap >= 90000 && depIdx < departures.flights.length) {  // 90초 이상 갭
            const dep = departures.flights[depIdx];
            movements.push({
              type: 'DEPARTURE',
              callsign: dep.callsign,
              scheduledTime: new Date(lastMovementTime.getTime() + 60000),
              runway: config.runway
            });
            depIdx++;
          }
        }
      }
    }

    return movements;
  }
}
```

---

## 14. 데이터 포맷 및 프로토콜

### 14.1 ASTERIX 포맷 개요

ASTERIX (All Purpose Structured EUROCONTROL Surveillance Information Exchange)는 유럽 표준 감시 데이터 교환 포맷

#### 주요 카테고리

| 카테고리 | 용도 |
|----------|------|
| CAT 010 | Monosensor Surface Movement Data |
| CAT 020 | Multilateration Target Reports |
| CAT 021 | ADS-B Target Reports |
| CAT 048 | Monoradar Target Reports |
| CAT 062 | System Track Data |

#### CAT 021 (ADS-B) 데이터 항목

```typescript
interface ASTERIX_CAT021 {
  // I021/010 - Data Source Identifier
  dataSourceId: { sac: number; sic: number; };

  // I021/040 - Target Report Descriptor
  targetReportDescriptor: {
    atp: number;      // Address Type
    arc: number;      // Altitude Reporting Capability
    rc: number;       // Range Check
    rab: boolean;     // Report from Aircraft Beacon
  };

  // I021/080 - Target Address
  targetAddress: string;    // 24-bit ICAO address

  // I021/130 - Position in WGS-84
  positionWGS84: {
    latitude: number;       // degrees
    longitude: number;      // degrees
  };

  // I021/140 - Geometric Height
  geometricHeight: number;  // feet

  // I021/145 - Flight Level
  flightLevel: number;

  // I021/150 - Air Speed
  airSpeed: number;         // knots

  // I021/151 - True Air Speed
  trueAirSpeed: number;     // knots

  // I021/160 - Airborne Ground Vector
  groundVector: {
    groundSpeed: number;    // knots
    trackAngle: number;     // degrees
  };

  // I021/170 - Target Identification
  targetId: string;         // callsign

  // I021/200 - Target Status
  targetStatus: {
    icf: boolean;           // Intent Change Flag
    lnav: boolean;          // LNAV Mode
    ps: number;             // Priority Status (0-7)
    ss: number;             // Surveillance Status (0-3)
  };

  // I021/230 - Roll Angle
  rollAngle: number;        // degrees

  // I021/400 - Receiver ID
  receiverId: number;

  timeOfApplicability: Date;
}
```

### 14.2 FIXM (Flight Information Exchange Model)

```xml
<!-- FIXM 4.2 Flight Plan Example -->
<flight xmlns="http://www.fixm.aero/flight/4.2">
  <flightIdentification>
    <aircraftIdentification>KAL018</aircraftIdentification>
  </flightIdentification>

  <gufi codeSpace="urn:uuid">a1b2c3d4-e5f6-7890-abcd-ef1234567890</gufi>

  <departure>
    <aerodrome>
      <locationIndicator>RKSI</locationIndicator>
    </aerodrome>
    <estimatedOffBlockTime>2025-01-15T09:45:00Z</estimatedOffBlockTime>
  </departure>

  <arrival>
    <aerodrome>
      <locationIndicator>KLAX</locationIndicator>
    </aerodrome>
    <arrivalAerodrome>
      <locationIndicator>KLAX</locationIndicator>
    </arrivalAerodrome>
  </arrival>

  <aircraft>
    <aircraftType>
      <icaoAircraftTypeDesignator>B77W</icaoAircraftTypeDesignator>
    </aircraftType>
    <wakeTurbulence>HEAVY</wakeTurbulence>
  </aircraft>

  <enRoute>
    <cruisingSpeed uom="KT">450</cruisingSpeed>
    <cruisingLevel>
      <flightLevel uom="FL">350</flightLevel>
    </cruisingLevel>
  </enRoute>
</flight>
```

---

## 15. 시뮬레이션 데이터 생성

### 15.1 Traffic Generator

```typescript
interface TrafficGeneratorConfig {
  airport: string;
  startTime: Date;
  duration: number;           // minutes
  arrivalRate: number;        // per hour
  departureRate: number;      // per hour
  airlines: AirlineConfig[];
  destinations: string[];
  origins: string[];
}

interface AirlineConfig {
  icao: string;               // KAL
  iata: string;               // KE
  name: string;               // Korean Air
  fleetTypes: string[];       // ['B77W', 'A388', 'B789']
  weight: number;             // 비중 (0-1)
}

class TrafficGenerator {
  private config: TrafficGeneratorConfig;
  private aircraftDb: Map<string, AircraftPerformance>;
  private airportDb: Map<string, Airport>;

  generate(): ScenarioFlight[] {
    const flights: ScenarioFlight[] = [];
    const totalMinutes = this.config.duration;

    // 도착편 생성
    const arrivalInterval = 60 / this.config.arrivalRate;
    for (let t = 0; t < totalMinutes; t += arrivalInterval) {
      flights.push(this.generateArrival(t));
    }

    // 출발편 생성
    const departureInterval = 60 / this.config.departureRate;
    for (let t = 0; t < totalMinutes; t += departureInterval) {
      flights.push(this.generateDeparture(t));
    }

    return flights.sort((a, b) =>
      this.parseTime(a.scheduledTime) - this.parseTime(b.scheduledTime)
    );
  }

  private generateArrival(minuteOffset: number): ScenarioFlight {
    const airline = this.pickAirline();
    const flightNum = this.generateFlightNumber(airline);
    const aircraft = this.pickAircraftType(airline);
    const origin = this.pickOrigin();
    const runway = this.pickArrivalRunway();
    const gate = this.pickGate();

    return {
      callsign: `${airline.icao}${flightNum}`,
      type: 'ARRIVAL',
      aircraftType: aircraft,
      scheduledTime: this.formatTime(minuteOffset),
      origin,
      runway,
      gate
    };
  }

  private generateDeparture(minuteOffset: number): ScenarioFlight {
    const airline = this.pickAirline();
    const flightNum = this.generateFlightNumber(airline);
    const aircraft = this.pickAircraftType(airline);
    const destination = this.pickDestination();
    const runway = this.pickDepartureRunway();
    const gate = this.pickGate();
    const route = this.generateRoute(destination, runway);

    return {
      callsign: `${airline.icao}${flightNum}`,
      type: 'DEPARTURE',
      aircraftType: aircraft,
      scheduledTime: this.formatTime(minuteOffset),
      destination,
      runway,
      gate,
      route
    };
  }

  private generateRoute(destination: string, runway: string): string {
    const airport = this.airportDb.get(this.config.airport)!;
    const sids = airport.sids.filter(s => s.runway === runway);

    if (sids.length === 0) return 'DCT';

    const sid = sids[Math.floor(Math.random() * sids.length)];
    return `${sid.id} ${sid.waypoints[sid.waypoints.length - 1].name}`;
  }
}
```

### 15.2 Real-time Event Simulator

```typescript
class RealtimeEventSimulator {
  private flights: Map<string, SimulatedFlight>;
  private eventQueue: PriorityQueue<SimulationEvent>;
  private currentTime: Date;
  private speedFactor: number = 1;  // 1x, 2x, 10x 등

  startSimulation(): void {
    this.mainLoop();
  }

  private mainLoop(): void {
    const realInterval = 1000;  // 1초
    const simInterval = realInterval * this.speedFactor;

    setInterval(() => {
      this.currentTime = new Date(this.currentTime.getTime() + simInterval);
      this.processEvents();
      this.updatePositions();
      this.broadcastUpdates();
    }, realInterval);
  }

  private processEvents(): void {
    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.peek();
      if (event.time > this.currentTime) break;

      this.eventQueue.pop();
      this.handleEvent(event);
    }
  }

  private handleEvent(event: SimulationEvent): void {
    switch (event.type) {
      case 'FLIGHT_FILED':
        this.createStrip(event.flight);
        break;
      case 'CLEARANCE_DELIVERY':
        this.updateStripStatus(event.flightId, 'CLEARANCE_DELIVERED');
        break;
      case 'PUSHBACK_START':
        this.updateStripStatus(event.flightId, 'PUSH_APPROVED');
        this.startSurfaceMovement(event.flightId, 'PUSHBACK');
        break;
      case 'TAXI_START':
        this.updateStripStatus(event.flightId, 'TAXIING');
        this.startSurfaceMovement(event.flightId, 'TAXI');
        break;
      case 'HOLDING_POINT_REACHED':
        this.updateStripStatus(event.flightId, 'HOLDING');
        break;
      case 'LINEUP':
        this.updateStripStatus(event.flightId, 'LINEUP');
        break;
      case 'TAKEOFF':
        this.updateStripStatus(event.flightId, 'TAKEOFF_CLEARED');
        this.startTakeoffRoll(event.flightId);
        break;
      case 'AIRBORNE':
        this.updateStripStatus(event.flightId, 'DEPARTED');
        this.removeSurfaceTarget(event.flightId);
        break;
      case 'FINAL_APPROACH':
        this.updateStripStatus(event.flightId, 'FINAL_APPROACH');
        break;
      case 'LANDED':
        this.updateStripStatus(event.flightId, 'LANDED');
        this.startLandingRoll(event.flightId);
        break;
      case 'TAXI_IN_START':
        this.updateStripStatus(event.flightId, 'TAXI_IN');
        this.startSurfaceMovement(event.flightId, 'TAXI_IN');
        break;
      case 'AT_GATE':
        this.updateStripStatus(event.flightId, 'AT_GATE');
        break;
    }
  }
}
```

### 15.3 샘플 공항 데이터 (RKSI - 인천국제공항)

```typescript
const RKSI_DATA: Airport = {
  icao: 'RKSI',
  iata: 'ICN',
  name: 'Incheon International Airport',
  location: {
    latitude: 37.4691,
    longitude: 126.4505
  },
  elevation: 23,
  timezone: 'Asia/Seoul',

  runways: [
    {
      id: '33L',
      heading: 330,
      length: 3750,
      width: 60,
      threshold: { latitude: 37.4445, longitude: 126.4629 },
      ils: { frequency: 109.9, course: 330, glideslope: 3.0 }
    },
    {
      id: '15R',
      heading: 150,
      length: 3750,
      width: 60,
      threshold: { latitude: 37.4828, longitude: 126.4398 },
      ils: { frequency: 110.3, course: 150, glideslope: 3.0 }
    },
    {
      id: '33R',
      heading: 330,
      length: 4000,
      width: 60,
      threshold: { latitude: 37.4509, longitude: 126.4831 },
      ils: { frequency: 111.1, course: 330, glideslope: 3.0 }
    },
    {
      id: '15L',
      heading: 150,
      length: 4000,
      width: 60,
      threshold: { latitude: 37.4950, longitude: 126.4563 },
      ils: { frequency: 108.9, course: 150, glideslope: 3.0 }
    }
  ],

  sids: [
    {
      id: 'GOSAN1B',
      type: 'SID',
      runway: '33L',
      waypoints: [
        { name: 'ICN33L', latitude: 37.4828, longitude: 126.4398 },
        { name: 'IC557', latitude: 37.5200, longitude: 126.3500, altitude: { constraint: 'ABOVE', value: 3000 } },
        { name: 'GOSAN', latitude: 37.7500, longitude: 126.0000, altitude: { constraint: 'ABOVE', value: 10000 } }
      ]
    },
    {
      id: 'KARBU1A',
      type: 'SID',
      runway: '33L',
      waypoints: [
        { name: 'ICN33L', latitude: 37.4828, longitude: 126.4398 },
        { name: 'IC459', latitude: 37.5500, longitude: 126.5000, altitude: { constraint: 'ABOVE', value: 4000 } },
        { name: 'KARBU', latitude: 37.9000, longitude: 126.8000, altitude: { constraint: 'ABOVE', value: 12000 } }
      ]
    }
  ],

  stars: [
    {
      id: 'OLMEN1A',
      type: 'STAR',
      runway: '33R',
      waypoints: [
        { name: 'OLMEN', latitude: 37.2000, longitude: 126.2000 },
        { name: 'IC741', latitude: 37.3000, longitude: 126.3500, altitude: { constraint: 'AT', value: 7000 } },
        { name: 'IC743', latitude: 37.3800, longitude: 126.4200, altitude: { constraint: 'AT', value: 4000 } }
      ]
    }
  ],

  gates: [
    // Terminal 1
    { id: '101', terminal: 'T1', latitude: 37.4491, longitude: 126.4505 },
    { id: '102', terminal: 'T1', latitude: 37.4492, longitude: 126.4510 },
    // ... 추가 게이트
    // Terminal 2
    { id: '231', terminal: 'T2', latitude: 37.4600, longitude: 126.4400 },
    { id: '232', terminal: 'T2', latitude: 37.4601, longitude: 126.4405 },
  ],

  holdingPatterns: [
    { fix: 'GOSAN', altitude: 10000, direction: 'RIGHT', legTime: 60 },
    { fix: 'OLMEN', altitude: 8000, direction: 'LEFT', legTime: 60 }
  ]
};
```

---

## 참고 자료

### 공식 문서
- [FAA Electronic Flight Strips](https://www.faa.gov/air_traffic/technology/tfdm/efs)
- [FAA Flight Progress Strips Manual](https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap2_section_3.html)
- [EUROCONTROL FDPS Guidance](https://www.eurocontrol.int/publication/eurocontrol-guidance-material-flight-data-processing-system-fdps)
- [SKYbrary Flight Progress Strips](https://skybrary.aero/articles/flight-progress-strips)
- [SKYbrary A-SMGCS](https://skybrary.aero/articles/advanced-surface-movement-guidance-and-control-system-smgcs)

### 벤더 자료
- [Saab EFS](https://www.saab.com/products/electronic-flight-strips-EFS)
- [Saab A-SMGCS](https://www.saab.com/products/a-smgcs)
- [Indra NOVA 9000](https://www.indracompany.com/)
- [Insero E-STRIP](https://inseroats.com/air-traffic-control/)
- [ENAV TWR EFPS](https://www.enav.it/en/what-we-do/we-create-solutions-for-international-markets/air-traffic-management-atm-meteo-met/twr)
- [Frequentis AMAN/DMAN](https://www.frequentis.com/en/air-traffic-management/traffic-optimisation)

### 오픈소스 참고
- [AntiFaffStrips/Strips (VATSIM)](https://github.com/AntiFaffStrips/Strips)
- [Awesome VATSIM](https://github.com/Epse/awesome-vatsim)
- [ICAO ATS Message Parser](https://github.com/pventon/ICAO-ATS-and-OLDI-Message-Parser)

### 표준 및 규격
- FIXM (Flight Information Exchange Model) - https://www.fixm.aero/
- AIXM (Aeronautical Information Exchange Model)
- ASTERIX - https://www.eurocontrol.int/asterix
- ICAO Doc 4444 (PANS-ATM)
- ICAO Doc 9830 (A-SMGCS Manual)
- EUROCAE ED-153, ED-205A
- SESAR Solutions

---

*문서 작성일: 2025-12-31*
*버전: 2.0*
