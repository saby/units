@Library('pipeline') _

def version = '24.2100'

node (get_label()) {
    checkout_pipeline("rc-${version}")
    run_branch = load '/home/sbis/jenkins_pipeline/platforma/branch/run_branch'
    run_branch.execute('units', version)
}