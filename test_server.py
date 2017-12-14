#!/usr/bin/env python
 
from http.server import BaseHTTPRequestHandler, HTTPServer
import requests

# HTTPRequestHandler class
class testHTTPServer_RequestHandler(BaseHTTPRequestHandler):
 
  # GET
  def do_GET(self):
        # Send response status code
        self.send_response(200)
 
        # Send headers
        #self.send_header('Content-type','application/x-google-protobuf')
        self.send_header('Content-type','text/plain')
        self.end_headers()
 
        # Send message back to client
        r = requests.get('https://digitransit:dtrjk23k@linkki.mattersoft.fi/api/gtfsrealtime/v1.0/feed/tripupdate')
        # Write content as utf-8 data
        self.wfile.write(r.content)
        r.close()
        return
 
def run():
  print('starting server...')
 
  # Server settings
  # Choose port 8080, for port 80, which is normally used for a http server, you need root access
  server_address = ('127.0.0.1', 8081)
  httpd = HTTPServer(server_address, testHTTPServer_RequestHandler)
  print('running server...')
  httpd.serve_forever()
 
 
run()