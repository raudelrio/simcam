package SimCam::Camera;
use Data::Dumper;
use Mojo::Base 'Mojolicious::Controller';

sub save {
    my $self = shift;
    my $params = $self->req->json();

    my $schema = $self->app->schema;
    my $camera_rs = $schema->resultset('Camera');
    $params->{image} = $params->{final_image};

    my @values = qw/alpha near far final_image fov image job_id  p_x p_y p_z r1 r2 r3 r_x r_y r_z success t1 t2 u v /;
    my $fixed_params = {};

    foreach my $value (@values){
        
       $fixed_params->{$value} = $params->{$value} if( $params->{$value} )
    }

    my $camera = $camera_rs->create(
        $fixed_params        
    );

    $self->render({ json => $camera });
}

sub get_camera {
    my $self = shift;
    my $id = $self->param('id');

    my $schema = $self->app->schema;
    my $camera_rs = $schema->resultset('Camera');
    my $found = $camera_rs->find({id => $id});
    if( $found ) {
        $self->render({json => $found } );
    } else {
        $self->render({json => {} } );
    }

}

sub cameras {
    my $self = shift;

    my $schema = $self->app->schema;
    my $camera_rs = $schema->resultset('Camera');
    my @cameras = $camera_rs->all();

        $self->render({json => \@cameras } );

}

1;
