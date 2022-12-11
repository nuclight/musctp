#!/usr/bin/env perl

use strict;
use warnings;
use 5.012;

use IO::Compress::RawDeflate qw(rawdeflate);
use CBOR::XS;
use Compress::Raw::Zlib;
use Compress::Zlib;

my $dictionary = "DSACK";

my $struct = {
    SACK    => [
        0x12345678,
        0x2345,
        "abc"
    ],
};

my $zip;
my ($output, $status);
my $x;
my $cbor = encode_cbor $struct;

say "cbor " . length($cbor) . " bytes";
print $cbor;

my $plain = $cbor;;

#rawdeflate(\$plain, \$zip)    or die "pack failure";
#my $x = new Compress::Raw::Zlib::Deflate({-Level => Z_BEST_COMPRESSION, -Dictionary => $dictionary});
($x, $status) = deflateInit({-Level => Z_BEST_COMPRESSION, -Dictionary => $dictionary});
my $dictID = $x->dict_adler() ;
warn "dictID=$dictID";
($output, $status) = $x->deflate($_);
$status == Z_OK
    or die "deflation failed\n" ;

($output, $status) = $x->flush(Z_SYNC_FLUSH) ;
$status == Z_OK
    or die "deflation failed\n" ;

$zip = $output;
say "\nzip " . length($zip) . " bytes";
print $zip;
