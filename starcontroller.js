#!/usr/bin/gjs

const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Webkit = imports.gi.WebKit;
const GUsb = imports.gi.GUsb;
const Mainloop = imports.mainloop;


let running = false;
const HelloGNOME = new Lang.Class ({
    Name: 'StarController',
    FullScreen: false,
      // Create the application itself
    _init: function () {
        this.application = new Gtk.Application ();

        // Connect 'activate' and 'startup' signals to the callback functions
        this.application.connect('activate', Lang.bind(this, this._onActivate));
        this.application.connect('startup', Lang.bind(this, this._onStartup));
    },

    // Callback function for 'activate' signal presents windows when active
    _onActivate: function () {
        this._window.present ();
    },

    // Callback function for 'startup' signal builds the UI
    _onStartup: function () {
    	running = true;

        this._pollUSB();
        this._buildUI ();

    },
        // Build the application's UI
    _buildUI: function () {

        // Create the application window
        this._window = new Gtk.ApplicationWindow  ({
            application: this.application,
            title: "",
            default_height: 480,
            default_width: 800,
            window_position: Gtk.WindowPosition.CENTER });
               // Create a webview to show the web app
        this._webView = new Webkit.WebView ();
        var settings = new Webkit.WebSettings()
        settings.set_property('enable-xss-auditor', false);
        settings.set_property('enable-universal-access-from-file-uris', true);
        this._webView.set_settings(settings)

        // Put the web app into the webview
        this._webView.load_uri (GLib.filename_to_uri (GLib.get_current_dir() +
            "/ui.html", null));

              // Put the webview into the window
        this._window.add (this._webView);

        // Show the window and all child widgets
        this._window.show_all();

        this.toggleFullScreen();
    },
    _pollUSB: function() {
      print("Checking");
      var result = GLib.spawn_command_line_sync('lsusb');
      if (String(result[1]).indexOf("0a12:0001") >= 0) {
          print("Found first device");
          if(this._webView) {
          this._webView.execute_script("deviceEvent('add', 1);");
          }
      } else {
          if(this._webView) {
          this._webView.execute_script("deviceEvent('remove', 1);");
          }
      }

      if (String(result[1]).indexOf("1997:7a03") >= 0) {
        print("Found second device");
        if (this._webView) {
        this._webView.execute_script("deviceEvent('add', 2);");
        }
      }
      else {
        if (this._webView) {
        this._webView.execute_script("deviceEvent('remove', 2);");
        }
      }
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, this._pollUSB.bind(this), null);
      return false;

      /*
      this. context = GUsb.Context.new();
      this.context.get_source(GLib.MainContext.default());
      //this.context.enumerate();
      this.deviceList = GUsb.DeviceList.new(this.context);
      this.deviceList.coldplug();

      var deviceEvent = function(event, deviceList, device) {
        try {
        var vid = ("0000" + device.get_vid().toString(16)).slice(-4);
        var pid = ("0000" + device.get_pid().toString(16)).slice(-4);
        var id = vid + ":" + pid;
        if (id === "0a12:0001") {
          print("Found first device");
          this._webView.execute_script("deviceEvent('" + event + "', 1);");


        }
        if (id === "1997:7a03") {
          print("Found second device");
          this._webView.execute_script("deviceEvent('" + event + "', 2);");
        }
        } catch(e) {
          print(e);
        }
      };

      this.deviceList.connect('device-added', deviceEvent.bind(this, 'add'));
      this.deviceList.connect('device-removed', deviceEvent.bind(this, 'removed'));
      */
    },
    toggleFullScreen: function() {
    	if(this.FullScreen) {
    		this._window.unfullscreen();
    	} else {
    		this._window.fullscreen();
	    }
	    this.FullScreen = !this.FullScreen;
    }
});

// Run the application
let app = new HelloGNOME ();
app.application.run (ARGV);
running = false;
