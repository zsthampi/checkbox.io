pipeline {
    agent { docker 'node:6.3' }
    stages {
        withEnv(['HOME=.']) 
        stage('build') {
            steps {
                sh 'cd server-side/site/;sudo npm install'
            }
        }
    }
}
