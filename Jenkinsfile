pipeline {
    agent { docker 'node:6.3' }
    stages {
        stage('build') {
            steps {
                withEnv(['HOME=.'])
                sh 'cd server-side/site/;npm install'
            }
        }
    }
}
