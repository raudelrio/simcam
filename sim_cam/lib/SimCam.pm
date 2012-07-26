package SimCam;
use Mojo::Base 'Mojolicious';

# This method will run once at server start
sub startup {
  my $self = shift;

  # Documentation browser under "/perldoc"
  $self->plugin('PODRenderer');

  # Router
  my $r = $self->routes;

  # Normal route to controller
  $r->get('/')->to('calibrate#root');
  $r->get('/counter')->to('calibrate#counter');

  # Noise
  $r->post('/noise')->to('environ#noise');
  $r->get('/noise/:alpha/:type')->to('environ#noiseid');

  # TODO:
  # $r->post('/calibrate');
  # $r->register('/register');

  $r->post('/distort')->to('environ#distort');


  
}

1;
