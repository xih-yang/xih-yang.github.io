# 1、Zipkin : Golang 微服务全链路监控（一）
- 来源：https://ddkk.com/zhuanlan/linktrack/zipkin/9.html
- 分类：链路追踪
- 分组：分布式链路踪 Golang 之 微服务
**1、** broker-service->auth-service->postgresdb；

**2、** zipkin监控：需代码入侵；

### 一、broker-service

**1、** 通过context传递span；

main.go

```java
package main
import (
	"broker-service/auth-service"
	"broker-service/svc1"
	"context"
	"fmt"
	"log"
	"net/http"
	"time"
	"github.com/opentracing/opentracing-go"
	zipkinot "github.com/openzipkin-contrib/zipkin-go-opentracing"
	"github.com/openzipkin/zipkin-go"
	zipkinhttp "github.com/openzipkin/zipkin-go/reporter/http"
)
var webPort = "8080"
const (
	// Our service name.
	serviceName = "client"
	// Host + port of our service.
	hostPort = "0.0.0.0:0"
	// Endpoint to send Zipkin spans to.
	zipkinHTTPEndpoint = "http://localhost:9411/api/v2/spans"
	// Base endpoint of our Auth service.
	authEndpoint = "http://localhost:8090"
)
type Config struct {
	Client Services
	Ctx    context.Context
}
type Services struct {
	Auth auth.Service
}
func main() {
	fmt.Println("Starting broker service: ", webPort)
	// set up a span reporter
	reporter := zipkinhttp.NewReporter(zipkinHTTPEndpoint)
	defer reporter.Close()
	// create our local service endpoint
	endpoint, err := zipkin.NewEndpoint(serviceName, hostPort)
	if err != nil {
		log.Fatalf("unable to create local endpoint: %+v\n", err)
	}
	// initialize our tracer
	nativeTracer, err := zipkin.NewTracer(reporter, zipkin.WithLocalEndpoint(endpoint))
	if err != nil {
		log.Fatalf("unable to create tracer: %+v\n", err)
	}
	// use zipkin-go-opentracing to wrap our tracer
	tracer := zipkinot.Wrap(nativeTracer)
	// optionally set as Global OpenTracing tracer instance
	opentracing.SetGlobalTracer(tracer)
	// Create Client to auth Services
	as := auth.NewHTTPClient(tracer, authEndpoint)
	// Create Root Span for duration of the interaction with svc1
	span := opentracing.StartSpan("Run")
	// Put root span in context so it will be used in our calls to the client.
	ctx := opentracing.ContextWithSpan(context.Background(), span)
	//setup config
	app := Config{
		Client: Services{
			Auth: as,
		},
		Ctx: ctx,
	}
	span.Finish()
	srv := &http.Server{
		Addr:    ":8080",
		Handler: app.routes(),
	}
	err = srv.ListenAndServe()
	if err != nil {
		log.Panic(err)
	}
}
```

**1、** 路由到auth服务；

router.go

```java
package main
import (
	"net/http"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)
func (app *Config) routes() http.Handler {
	mux := chi.NewRouter()
	mux.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{
     "https://*", "http://*"},
		AllowedMethods:   []string{
     "GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{
     "Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{
     "link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	mux.Use(middleware.Heartbeat("/ping"))
	mux.Post("/", app.Broker)
	mux.Post("/authenticate", app.Authenticate)
	mux.Post("/auth", app.Auth)
	return mux
}
```

### 二、handler.go

```java
package main
import (
	"broker-service/auth-service"
	"broker-service/event"
	"broker-service/logs"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/rpc"
	"strconv"
	"time"
	"github.com/opentracing/opentracing-go"
	otlog "github.com/opentracing/opentracing-go/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)
type RequestPayload struct {
	Action string        json:"action"
	Auth   AuthPayload   json:"auth,omitempty"
	Log    loggerPayload json:"log,omitempty"
}
type AuthPayload struct {
	Email    string json:"email"
	Password string json:"password"
}
type loggerPayload struct {
	Name string json:"name"
	Data string json:"data"
}
// zipkin 未监控
func (app *Config) authenticate(w http.ResponseWriter, r *http.Request, a AuthPayload) {
	var jsonFromService jsonResponse
	// create json and send to the auth microservice
	log.Println("auth: ", a)
	jsonData, _ := json.Marshal(a)
	//call the service
	msg := &HttpMessage{
		Url:    "http://authentication-service",
		Api:    "authenticate",
		Data:   jsonData,
		Method: "POST"}
	jsonFromService, status := msg.HttpClient()
	//make sure get back the correct status code
	if status == http.StatusUnauthorized {
		app.errorJSON(w, errors.New("invalid credentials"))
		return
	} else if status != http.StatusOK {
		log.Println("Data: ", jsonFromService, " | status:", status)
		app.errorJSON(w, errors.New("calling from service failed"))
		return
	}
	var payload jsonResponse
	payload.Error = false
	payload.Message = "Authenticated!"
	payload.Data = jsonFromService.Data
	app.writeJSON(w, http.StatusAccepted, payload)
}
// zipkin 监控
func (app *Config) Auth(w http.ResponseWriter, r *http.Request) {
	span, ctx := opentracing.StartSpanFromContext(app.Ctx, "Auth")
	defer span.Finish()
	var payload jsonResponse
	payload.Error = true
	payload.Message = "Authentication failed!"
	var requestPayload AuthPayload
	log.Println("request Auth")
	err := app.readJSON(w, r, &requestPayload)
	if err != nil {
		app.errorJSON(w, err)
		return
	}
	log.Println(requestPayload)
	span.LogFields(otlog.String("event", "Call Auth"))
	response, err := app.Client.Auth.Auth(
		ctx, auth.AuthPayload(requestPayload))
	//check
	if err != nil {
		app.errorJSON(w, errors.New("calling from svc1 failed"))
		log.Printf("Response err: %s\n", err.Error())
		return
	}
	log.Printf("Auth Rresponse: %v Err: %+v\n", response, err)
	payload.Error = false
	payload.Message = response.Message
	payload.Data = response.Data
	app.writeJSON(w, http.StatusAccepted, payload)
}
```
