var spawn = require('child_process').spawn;
module.exports = (cmd, args, onData, onError, onFinish) => {
    var options = args.split(' ');
    console.log(options)
    var proc = spawn(cmd, options);
    proc.stdout.on('data', onData);
    proc.stderr.setEncoding("utf8")
    proc.stderr.on('data', onError );
    proc.on('close', onFinish);
}