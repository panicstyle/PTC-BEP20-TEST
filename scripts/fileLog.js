var fs = require('fs')

module.exports = {
    writeln: function(s) {
        this.write(s + "\n");
    },
    write: function(s) {
        let fd;
        try {
            fd = fs.openSync(__dirname + '/result.log', 'a');
            fs.appendFileSync(fd, s, 'utf8');
        } catch (err) {
            /* Handle the error */
        } finally {
            if (fd !== undefined)
            fs.closeSync(fd);
        }
    }
}