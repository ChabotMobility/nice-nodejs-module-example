# 나이스 인증 모듈 Nodejs 예제


## Install


```
$ npm i
```


## Environment file

```
$ touch .env
```


```
# NICE평가정보에서 발급한 본인인증 서비스 개발 정보(사이트 코드 , 사이트 패스워드)
SITE_CODE=site_code
SITE_PASSWORD=site_password

# 없으면 기본 선택화면, X: 공인인증서, M: 핸드폰, C: 카드
AUTH_TYPE=

# Y : 취소버튼 있음 / N : 취소버튼 없음
POP_GUBUN=N

# 없으면 기본 웹페이지 / Mobile : 모바일페이지
CUSTOMIZE=Mobile

# 없으면 기본 선택화면, 0: 여자, 1: 남자
GENDER=

# 본인인증 처리 후, 결과 데이타를 리턴 받기위해 다음예제와 같이 http부터 입력합니다.
# 리턴url은 인증 전 인증페이지를 호출하기 전 url과 동일해야 합니다. ex) 인증 전 url : https://www.~ 리턴 url : https://www.~

# 성공시 이동될 URL (방식 : 프로토콜을 포함한 절대 주소)
RETURN_URL=

# 실패시 이동될 URL (방식 : 프로토콜을 포함한 절대 주소)
ERROR_URL=

# Default Redirect URL
HOSTNAME=https://hostname

```


## Run

### Development
```
$ npm run build:dev & npm run start
```

### Production
```
$ npm run build && npx pm2 start ecosystem.config.js
```


## API Spec


**GET /nice**

Content-Type: text/html

- Webpage
- 서버단에서 NICE 세션 유지용으로 쓰이는 암호화된 문자열 발급, 이를 form에 넣어 나이스 인증 페이지로 라우팅
- Parameter: success-url, fail-url, popup, mobile
- 사실상 이것만 쓰면 된다.


**GET /api/nice-auth/session**

Content-Type: application/json

- (위에서 사용되는 것과 동일한)서버단에서 NICE 세션 유지용으로 쓰이는 암호화된 문자열 발급


**POST /api/nice-auth/user-info**

Content-Type: application/json

- Body: EncodeData
- NICE 인증에서 넘어오는 기본 주소.


**GET /api/nice-auth/user-info**

Content-Type: application/json

- Parameter: EncodeData
- NICE에서 Chrome 80 이상인 PC의 경우에 Body가 아닌 URL Parameter 로 암호화된 사용자 정보가 넘어옴. 물론 이때 당연히 url-encoded 문자열임
