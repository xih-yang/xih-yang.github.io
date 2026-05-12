# 4、Zipkin : Golang 微服务全链路监控（四）
- 来源：https://ddkk.com/zhuanlan/linktrack/zipkin/12.html
- 分类：链路追踪
- 分组：分布式链路踪 Golang 之 微服务
**1、** broker-service->auth-service->postgresdb；

**2、** zipkin监控：需代码入侵；

**使用 zipkin 库的 serverMiddleware**，其通过 Http 跟踪（trace）链路。***访问 auth-service，需通过 zipkinhttp.NewClient() 方法***

```java
zipkinhttp "github.com/openzipkin/zipkin-go/middleware/http"
```

### 一、broker-service

**1、** 通过Http传递span；

main.go

```java
package main
import (
	"log"
	"net/http"
	zipkinhttp "github.com/openzipkin/zipkin-go/middleware/http"
)
type Config struct{
     }
const (
	// Our service name.
	serviceName = "auth"
	// Host + port of our service.
	hostPort = "localhost:8090"
	// Endpoint to send Zipkin spans to.
	zipkinHTTPEndpoint = "http://localhost:9411/api/v2/spans"
)
func main() {
	tracer := GetTracer(serviceName, hostPort, zipkinHTTPEndpoint)
	// create global zipkin http server middleware
	serverMiddleware := zipkinhttp.NewServerMiddleware(
		tracer, zipkinhttp.TagResponseSize(true),
	)
	// create global zipkin traced http client
	client, err := zipkinhttp.NewClient(tracer, zipkinhttp.ClientTrace(true))
	if err != nil {
		log.Fatalf("unable to create client: %+v\n", err)
	}
	app := Config{
     }
	router := http.NewServeMux()
	router.HandleFunc("/auth", app.Auth(client))
	if err = http.ListenAndServe(":8080", serverMiddleware(router)); err != nil {
		log.Panic(err)
	}
}
```

**1、** 访问auth服务；

handler.go

```java
package main
import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"github.com/openzipkin/zipkin-go"
	zipkinhttp "github.com/openzipkin/zipkin-go/middleware/http"
)
type AuthPayload struct {
	Email    string json:"email"
	Password string json:"password"
}
func (app *Config) Auth(client *zipkinhttp.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("auth service called with method: %s\n", r.Method)
		// retrieve span from context (created by server middleware)
		span := zipkin.SpanFromContext(r.Context())
		defer span.Finish()
		span.Tag("event", "authenticate")
		var requestPayload AuthPayload
		var payload jsonResponse
		payload.Error = true
		payload.Message = "Authentication failed!"
		err := app.readJSON(w, r, &requestPayload)
		if err != nil {
			app.errorJSON(w, err)
			return
		}
		// create json and send to the auth microservice
		log.Println("authRequst: ", requestPayload)
		jsonData, _ := json.Marshal(requestPayload)
		url := "http://localhost:8090"
		newRequest, err := http.NewRequest("POST", url+"/authenticate", bytes.NewBuffer(jsonData))
		if err != nil {
			log.Printf("unable to create client: %+v\n", err)
			app.errorJSON(w, err, http.StatusBadRequest)
			span.Tag("Error: ", err.Error())
			return
		}
		newRequest.Header.Add("Content-type", "application/json")
		ctx := zipkin.NewContext(newRequest.Context(), span)
		newRequest = newRequest.WithContext(ctx)
		resp, err := client.DoWithAppSpan(newRequest, "auth")
		if err != nil {
			log.Printf("call to auth returned error: %+v\n", err)
			app.errorJSON(w, err, http.StatusBadGateway)
			span.Tag("Error: ", err.Error())
			return
		}
		defer resp.Body.Close()
		err = json.NewDecoder(resp.Body).Decode(&payload)
		if err != nil {
			app.errorJSON(w, err, http.StatusBadGateway)
			span.Tag("Error: ", err.Error())
			return
		}
		app.writeJSON(w, http.StatusAccepted, payload)
	}
}
```
