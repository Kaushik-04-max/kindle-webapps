"""Plain-HTTP relay for old Kindle browsers that cannot open HTTPS sites.

The Kindle opens http://<this computer's IP>:8080/lyrics on your home Wi-Fi. This script
fetches the same address from your Cloudflare Worker over HTTPS and passes it back.
Only GET requests to your own Worker are relayed (it is not an open proxy).

Run:  python kindle_proxy.py
Stop: Ctrl+C
"""
import socket
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

UPSTREAM = "https://kindle-lyrics.<your-subdomain>.workers.dev"  # <- set this to your deployed Worker URL
PORT = 8080
PASS_HEADERS = ("content-type", "cache-control")


class Relay(BaseHTTPRequestHandler):
    def do_GET(self):
        if not self.path.startswith("/"):
            self.send_error(400)
            return
        req = urllib.request.Request(UPSTREAM + self.path, headers={"User-Agent": "KindleRelay/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                body = r.read()
                self.send_response(r.status)
                for h in PASS_HEADERS:
                    if r.headers.get(h):
                        self.send_header(h, r.headers[h])
        except urllib.error.HTTPError as e:
            body = e.read()
            self.send_response(e.code)
            self.send_header("content-type", e.headers.get("content-type", "text/plain"))
        except Exception as e:  # network down, DNS, timeout
            body = ("Relay could not reach the Worker: %s" % e).encode()
            self.send_response(502)
            self.send_header("content-type", "text/plain")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))  # no packet is sent; picks the Wi-Fi interface
        return s.getsockname()[0]
    except OSError:
        return "your-computer-ip"
    finally:
        s.close()


if __name__ == "__main__":
    print("Kindle relay running. On the Kindle, open:")
    print("  http://%s:%d/lyrics" % (lan_ip(), PORT))
    print("  http://%s:%d/nowplaying" % (lan_ip(), PORT))
    print("Keep this window open. Press Ctrl+C to stop.")
    ThreadingHTTPServer(("0.0.0.0", PORT), Relay).serve_forever()
