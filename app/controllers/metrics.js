import Prometheus from 'prom-client';

export function metrics (req, res) {
  res.set('Content-Type', Prometheus.register.contentType);
  res.end(Prometheus.register.metrics());
}