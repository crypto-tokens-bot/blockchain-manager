We can check our queue:

```
redis-cli KEYS "bull:event-queue:*"
```
```
redis-cli HGETALL bull:event-queue:1
```

![](/utilits%20/static/output.png)