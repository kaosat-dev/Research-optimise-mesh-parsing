Various experiments in order to figure out better ways to load 3d data in the browser (streams, observable) for the following formats:
- 3MF
- stl
- ???


#Notes so far


##First issue found :

###Not sending data to worker as transferable
using transferable objects in the worker => main direction is good
BUT if we fail to use it in       main => worker direction, it is a lot less


#testing
- approximation of current methods, find the limits, possible memory issues/spikes etc
- transferable objects, in both directions
- manual chunking, both directions (excludes transferable objects, except if we were dealing with a "threadpool?")
- using streams as input and as ouput
