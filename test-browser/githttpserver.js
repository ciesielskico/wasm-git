/**
 * This example will create a git http server to repositories on your local disk.
 * Set the GIT_PROJECT_ROOT environment variable to point to location of your git repositories.
 */

function startServer() {
    const http = require('http');
    const fs = require('fs');
    const cgi = require('cgi');

    const { tmpdir } = require('os');
    const { execSync } = require('child_process');

    try {
    fs.rmdirSync(`${tmpdir()}/testrepo.git`, { recursive: true, force: true });
    fs.rmdirSync(`${tmpdir()}/test-clone`, { recursive: true, force: true });
    } catch (e) {}

    execSync(`git init --bare ${tmpdir()}/testrepo.git`);
    const cwd = `${tmpdir()}/test-clone`;

    execSync(`git clone ${tmpdir()}/testrepo.git ${cwd}`);
    fs.writeFileSync(`${cwd}/README.md`, 'Any content');
    execSync(`git add .`, { cwd });
    execSync(`git commit -m "add README"`, { cwd });
    execSync(`git push origin master`, { cwd });

    execSync(`git checkout -b test-branch`, { cwd });
    fs.writeFileSync(`${cwd}/test.txt`, '1');
    execSync(`git add .`, { cwd });
    execSync(`git commit -m "add test.txt"`, { cwd });
    execSync(`git push origin test-branch`, { cwd });

    const script = 'git';

    const gitcgi = cgi(script, {args: ['http-backend'],
        stderr: process.stderr,
        env: {
            'GIT_PROJECT_ROOT': tmpdir(),
            'GIT_HTTP_EXPORT_ALL': '1',
            'REMOTE_USER': 'test@example.com' // Push requires authenticated users by default
        }
    });

    return http.createServer( (request, response) => {
        let path = request.url.substring(1);

        console.log('git http server request', request.url);
        
        if (path.indexOf('ping') > -1) {
            response.statusCode = 200;
            response.end('pong');
        } else if( path.indexOf('git-upload') > -1 ||
            path.indexOf('git-receive') > -1) {
            gitcgi(request, response);
        } else {
            response.statusCode = 404;
            response.end('not found');
        }
    }).listen(8080);
}

module.exports = {
    startServer: startServer
}