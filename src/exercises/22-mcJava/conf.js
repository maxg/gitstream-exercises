'use strict'

var CLASSPATH = '.classpath',
    PROJECT = '.project',
    GITIGNORE = '.gitignore',
    SRC = 'src',
    ARRAYS = 'src/ArrayUtil.java',
    ARRAYS_OTHER = 'ArrayUtil_other.java'

module.exports = {
    global: {
        timeLimit: Infinity
    },

    machine: {
        startState: 'editFile',

        editFile: {
            handlePreCommit: function( repo, action, info, gitDone, stepDone ) {
                var conflict = {
                    msg: 'Implemented argmax',
                    files: [ {
                        src: ARRAYS_OTHER,
                        dest: ARRAYS
                    } ]
                }
                this.addCommit( conflict, function( err ) {
                    gitDone( Number(!!err), err )
                    stepDone('pushCommit')
                })
            }
        },
        // possibly disable all pulls between these states to prevent pulling down the conflict
        pushCommit: {
            onPreInfo: 'pullRepo'
        },

        pullRepo: {
            onPull: 'mergeFile'
        },

        mergeFile: {
            handlePreCommit: function( repo, action, info, gitDone, stepDone ) {
                this.shadowFileContains( ARRAYS, /(<{7}|>{7}|={7})/g, function( err, containsConflict ) {
                    if ( !containsConflict ) {
                        gitDone()
                        stepDone( 'mergeFile', { ok: true } )
                    } else {
                        gitDone( 1, '\x1b[311mGitStream: [COMMIT REJECTED] You forgot to remove the conflict markers\x1b[0m' )
                        stepDone( 'mergeFile', { ok: false } )
                    }
                })
            },
            onReceive: function( repo, action, info, done ) {
                var pushingToMaster = info.reduce( function( master, update ) {
                    return master || update.name === 'refs/heads/master'
                }, false )
                return pushingToMaster ? done('done') : done()
            }
        },

        done: null
    },

    viewer: {
        title: 'Handling a merge conflict (Java)',

        steps: {
            editFile: 'Import the project into Eclipse, and implement the <code>argmax</code> method. Make sure the test passes, and commit your work.',
            pushCommit: 'Push your commit.',
            pullRepo: 'Your collaborator has pushed a new commit, so your repo is out of date! Pull the repo to get the latest changes.',
            mergeFile: 'There was a merge conflict! Edit the file and merge the changes (remember to refresh the Eclipse project). When the tests pass, add, commit, and push!'
        },

        feedback: {
            mergeFile: {
                mergeFile: function( stepOutput, cb ) {
                    var FEEDBACK = 'You forgot to remove the conflict markers (&lt&lt&lt&lt&lt&lt&lt, =======, and &gt&gt&gt&gt&gt&gt&gt)'
                    cb( stepOutput.prev.ok ? '' : FEEDBACK )
                }
            }
        }
    },

    repo: {
        commits: [
            {
                msg: 'Initial commit',
                author: 'George Du <gdu@mit.edu>', // must be in User <email> format
                files: [ PROJECT, CLASSPATH, GITIGNORE, SRC ]
            }
        ]
    }
}
