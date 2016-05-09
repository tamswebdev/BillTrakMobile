function TouchID() {
}

TouchID.prototype.isAvailable = function (successCallback, errorCallback) {
  cordova.exec(successCallback, errorCallback, "TouchID", "isAvailable", []);
};

TouchID.prototype.verifyFingerprint = function (message, successCallback, errorCallback) {
	alert("aaa");
  cordova.exec(successCallback, errorCallback, "TouchID", "verifyFingerprint", [message]);
  alert("bbb");
};

TouchID.install = function () {
  if (!window.plugins) {
    window.plugins = {};
  }

  window.plugins.touchid = new TouchID();
  return window.plugins.touchid;
};

//window.plugins.touchid = new TouchID();
//cordova.addConstructor(TouchID.install);

  if (!window.plugins) {
    window.plugins = {};
  }

  window.plugins.touchid = new TouchID();
  //return window.plugins.touchid;

